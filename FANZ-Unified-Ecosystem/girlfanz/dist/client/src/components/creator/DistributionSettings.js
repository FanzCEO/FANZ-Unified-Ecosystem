"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DistributionSettings;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const switch_1 = require("@/components/ui/switch");
const label_1 = require("@/components/ui/label");
const input_1 = require("@/components/ui/input");
const textarea_1 = require("@/components/ui/textarea");
const badge_1 = require("@/components/ui/badge");
const calendar_1 = require("@/components/ui/calendar");
const popover_1 = require("@/components/ui/popover");
const select_1 = require("@/components/ui/select");
const use_toast_1 = require("@/hooks/use-toast");
const queryClient_1 = require("@/lib/queryClient");
const date_fns_1 = require("date-fns");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
function DistributionSettings({ sessionId, onDistribute }) {
    const [platforms, setPlatforms] = (0, react_1.useState)([
        { id: 'instagram', name: 'Instagram', icon: lucide_react_1.Instagram, enabled: true, connected: true },
        { id: 'tiktok', name: 'TikTok', icon: lucide_react_1.Music2, enabled: true, connected: true },
        { id: 'twitter', name: 'Twitter', icon: lucide_react_1.Twitter, enabled: false, connected: true },
        { id: 'youtube', name: 'YouTube', icon: lucide_react_1.Youtube, enabled: false, connected: false },
    ]);
    const [settings, setSettings] = (0, react_1.useState)({
        platforms: ['instagram', 'tiktok'],
        publishSchedule: 'now',
        caption: '',
        hashtags: [],
        visibility: 'public',
        generateQrCode: true,
        generateSmartLink: true,
        autoRetargeting: true,
        crossPromote: true,
        notifyFollowers: true,
    });
    const [hashtagInput, setHashtagInput] = (0, react_1.useState)('');
    const [showSchedulePicker, setShowSchedulePicker] = (0, react_1.useState)(false);
    const { toast } = (0, use_toast_1.useToast)();
    // Create distribution campaign
    const distributeMutation = (0, react_query_1.useMutation)({
        mutationFn: () => {
            var _a;
            return (0, queryClient_1.apiRequest)('/api/creator/content/distribute', {
                method: 'POST',
                body: {
                    sessionId,
                    platforms: settings.platforms,
                    publishSchedule: settings.publishSchedule === 'scheduled' ? {
                        date: (_a = settings.scheduledDate) === null || _a === void 0 ? void 0 : _a.toISOString(),
                        time: settings.scheduledTime,
                    } : null,
                    settings: {
                        caption: settings.caption,
                        hashtags: settings.hashtags,
                        visibility: settings.visibility,
                        price: settings.price,
                        generateQrCode: settings.generateQrCode,
                        generateSmartLink: settings.generateSmartLink,
                        autoRetargeting: settings.autoRetargeting,
                        crossPromote: settings.crossPromote,
                        notifyFollowers: settings.notifyFollowers,
                    },
                },
            });
        },
        onSuccess: () => {
            onDistribute();
            toast({
                title: 'Distribution started!',
                description: settings.publishSchedule === 'now'
                    ? 'Your content is being distributed to selected platforms.'
                    : `Your content will be published on ${(0, date_fns_1.format)(settings.scheduledDate, 'PPP')}`,
            });
        },
        onError: () => {
            toast({
                title: 'Distribution failed',
                description: 'Please check your platform connections and try again.',
                variant: 'destructive',
            });
        },
    });
    const togglePlatform = (platformId) => {
        setPlatforms(platforms.map(p => {
            if (p.id === platformId) {
                const newEnabled = !p.enabled;
                // Update settings.platforms
                if (newEnabled) {
                    setSettings(Object.assign(Object.assign({}, settings), { platforms: [...settings.platforms, platformId] }));
                }
                else {
                    setSettings(Object.assign(Object.assign({}, settings), { platforms: settings.platforms.filter(id => id !== platformId) }));
                }
                return Object.assign(Object.assign({}, p), { enabled: newEnabled });
            }
            return p;
        }));
    };
    const addHashtag = () => {
        if (hashtagInput && !settings.hashtags.includes(hashtagInput)) {
            setSettings(Object.assign(Object.assign({}, settings), { hashtags: [...settings.hashtags, hashtagInput] }));
            setHashtagInput('');
        }
    };
    const removeHashtag = (hashtag) => {
        setSettings(Object.assign(Object.assign({}, settings), { hashtags: settings.hashtags.filter(h => h !== hashtag) }));
    };
    const getSuggestedHashtags = () => {
        return ['trending', 'viral', 'fyp', 'foryou', 'exclusive', 'premium'];
    };
    return (React.createElement("div", { className: "space-y-6" },
        React.createElement(card_1.Card, null,
            React.createElement(card_1.CardHeader, null,
                React.createElement(card_1.CardTitle, null, "Select Platforms"),
                React.createElement(card_1.CardDescription, null, "Choose where to distribute your content")),
            React.createElement(card_1.CardContent, null,
                React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4" }, platforms.map((platform) => (React.createElement("div", { key: platform.id, className: (0, utils_1.cn)("relative p-4 rounded-lg border-2 transition-all cursor-pointer", platform.enabled
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"), onClick: () => platform.connected && togglePlatform(platform.id), "data-testid": `platform-${platform.id}` },
                    React.createElement("div", { className: "flex flex-col items-center gap-2" },
                        React.createElement(platform.icon, { className: "h-8 w-8" }),
                        React.createElement("span", { className: "text-sm font-medium" }, platform.name),
                        !platform.connected && (React.createElement(badge_1.Badge, { variant: "outline", className: "text-xs" }, "Not Connected"))),
                    platform.enabled && (React.createElement(lucide_react_1.CheckCircle, { className: "absolute top-2 right-2 h-5 w-5 text-primary" })))))))),
        React.createElement(card_1.Card, null,
            React.createElement(card_1.CardHeader, null,
                React.createElement(card_1.CardTitle, null, "Content Settings"),
                React.createElement(card_1.CardDescription, null, "Customize your post details")),
            React.createElement(card_1.CardContent, { className: "space-y-4" },
                React.createElement("div", { className: "space-y-2" },
                    React.createElement(label_1.Label, { htmlFor: "caption" }, "Caption"),
                    React.createElement(textarea_1.Textarea, { id: "caption", placeholder: "Write an engaging caption...", value: settings.caption, onChange: (e) => setSettings(Object.assign(Object.assign({}, settings), { caption: e.target.value })), rows: 4, "data-testid": "textarea-caption" }),
                    React.createElement("p", { className: "text-xs text-muted-foreground" }, "AI tip: Use emojis and a call-to-action for better engagement")),
                React.createElement("div", { className: "space-y-2" },
                    React.createElement(label_1.Label, { htmlFor: "hashtags" }, "Hashtags"),
                    React.createElement("div", { className: "flex gap-2" },
                        React.createElement(input_1.Input, { id: "hashtags", placeholder: "Add hashtag...", value: hashtagInput, onChange: (e) => setHashtagInput(e.target.value), onKeyPress: (e) => e.key === 'Enter' && (e.preventDefault(), addHashtag()), "data-testid": "input-hashtag" }),
                        React.createElement(button_1.Button, { onClick: addHashtag, size: "sm", "data-testid": "button-add-hashtag" },
                            React.createElement(lucide_react_1.Hash, { className: "h-4 w-4" }))),
                    settings.hashtags.length > 0 && (React.createElement("div", { className: "flex flex-wrap gap-2 mt-2" }, settings.hashtags.map((hashtag) => (React.createElement(badge_1.Badge, { key: hashtag, variant: "secondary", className: "cursor-pointer", onClick: () => removeHashtag(hashtag), "data-testid": `hashtag-${hashtag}` },
                        "#",
                        hashtag,
                        " \u00D7"))))),
                    React.createElement("div", { className: "flex flex-wrap gap-2 mt-2" },
                        React.createElement("span", { className: "text-xs text-muted-foreground" }, "Suggested:"),
                        getSuggestedHashtags().map((hashtag) => (React.createElement(badge_1.Badge, { key: hashtag, variant: "outline", className: "cursor-pointer text-xs", onClick: () => {
                                setHashtagInput(hashtag);
                                addHashtag();
                            }, "data-testid": `suggested-${hashtag}` },
                            "+#",
                            hashtag))))),
                React.createElement("div", { className: "space-y-2" },
                    React.createElement(label_1.Label, null, "Visibility"),
                    React.createElement(select_1.Select, { value: settings.visibility, onValueChange: (value) => setSettings(Object.assign(Object.assign({}, settings), { visibility: value })) },
                        React.createElement(select_1.SelectTrigger, { "data-testid": "select-visibility" },
                            React.createElement(select_1.SelectValue, null)),
                        React.createElement(select_1.SelectContent, null,
                            React.createElement(select_1.SelectItem, { value: "public" },
                                React.createElement("div", { className: "flex items-center gap-2" },
                                    React.createElement(lucide_react_1.Globe, { className: "h-4 w-4" }),
                                    "Public - Everyone can see")),
                            React.createElement(select_1.SelectItem, { value: "followers" },
                                React.createElement("div", { className: "flex items-center gap-2" },
                                    React.createElement(lucide_react_1.Users, { className: "h-4 w-4" }),
                                    "Followers Only")),
                            React.createElement(select_1.SelectItem, { value: "paid" },
                                React.createElement("div", { className: "flex items-center gap-2" },
                                    React.createElement(lucide_react_1.DollarSign, { className: "h-4 w-4" }),
                                    "Paid Content"))))),
                settings.visibility === 'paid' && (React.createElement("div", { className: "space-y-2" },
                    React.createElement(label_1.Label, { htmlFor: "price" }, "Price ($)"),
                    React.createElement(input_1.Input, { id: "price", type: "number", min: "0.99", step: "0.01", placeholder: "9.99", value: settings.price || '', onChange: (e) => setSettings(Object.assign(Object.assign({}, settings), { price: parseFloat(e.target.value) })), "data-testid": "input-price" }))))),
        React.createElement(card_1.Card, null,
            React.createElement(card_1.CardHeader, null,
                React.createElement(card_1.CardTitle, null, "Publishing Schedule"),
                React.createElement(card_1.CardDescription, null, "Choose when to publish your content")),
            React.createElement(card_1.CardContent, { className: "space-y-4" },
                React.createElement("div", { className: "flex gap-4" },
                    React.createElement(button_1.Button, { variant: settings.publishSchedule === 'now' ? 'default' : 'outline', onClick: () => setSettings(Object.assign(Object.assign({}, settings), { publishSchedule: 'now' })), "data-testid": "button-publish-now" }, "Publish Now"),
                    React.createElement(button_1.Button, { variant: settings.publishSchedule === 'scheduled' ? 'default' : 'outline', onClick: () => setSettings(Object.assign(Object.assign({}, settings), { publishSchedule: 'scheduled' })), "data-testid": "button-schedule" },
                        React.createElement(lucide_react_1.Clock, { className: "h-4 w-4 mr-2" }),
                        "Schedule")),
                settings.publishSchedule === 'scheduled' && (React.createElement("div", { className: "flex gap-2" },
                    React.createElement(popover_1.Popover, null,
                        React.createElement(popover_1.PopoverTrigger, { asChild: true },
                            React.createElement(button_1.Button, { variant: "outline", className: (0, utils_1.cn)("justify-start text-left font-normal", !settings.scheduledDate && "text-muted-foreground"), "data-testid": "button-pick-date" },
                                React.createElement(lucide_react_1.Calendar, { className: "mr-2 h-4 w-4" }),
                                settings.scheduledDate ? (0, date_fns_1.format)(settings.scheduledDate, "PPP") : "Pick a date")),
                        React.createElement(popover_1.PopoverContent, { className: "w-auto p-0", align: "start" },
                            React.createElement(calendar_1.Calendar, { mode: "single", selected: settings.scheduledDate, onSelect: (date) => setSettings(Object.assign(Object.assign({}, settings), { scheduledDate: date })), initialFocus: true }))),
                    React.createElement(input_1.Input, { type: "time", value: settings.scheduledTime || '', onChange: (e) => setSettings(Object.assign(Object.assign({}, settings), { scheduledTime: e.target.value })), "data-testid": "input-time" }))))),
        React.createElement(card_1.Card, null,
            React.createElement(card_1.CardHeader, null,
                React.createElement(card_1.CardTitle, null, "Marketing Tools"),
                React.createElement(card_1.CardDescription, null, "Enhance your distribution with smart features")),
            React.createElement(card_1.CardContent, { className: "space-y-4" },
                React.createElement("div", { className: "flex items-center justify-between" },
                    React.createElement(label_1.Label, { htmlFor: "qrCode", className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.QrCode, { className: "h-4 w-4" }),
                        "Generate QR Code"),
                    React.createElement(switch_1.Switch, { id: "qrCode", checked: settings.generateQrCode, onCheckedChange: (checked) => setSettings(Object.assign(Object.assign({}, settings), { generateQrCode: checked })), "data-testid": "switch-qr-code" })),
                React.createElement("div", { className: "flex items-center justify-between" },
                    React.createElement(label_1.Label, { htmlFor: "smartLink", className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.Link, { className: "h-4 w-4" }),
                        "Generate Smart Link"),
                    React.createElement(switch_1.Switch, { id: "smartLink", checked: settings.generateSmartLink, onCheckedChange: (checked) => setSettings(Object.assign(Object.assign({}, settings), { generateSmartLink: checked })), "data-testid": "switch-smart-link" })),
                React.createElement("div", { className: "flex items-center justify-between" },
                    React.createElement(label_1.Label, { htmlFor: "retargeting", className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.TrendingUp, { className: "h-4 w-4" }),
                        "Auto Retargeting"),
                    React.createElement(switch_1.Switch, { id: "retargeting", checked: settings.autoRetargeting, onCheckedChange: (checked) => setSettings(Object.assign(Object.assign({}, settings), { autoRetargeting: checked })), "data-testid": "switch-retargeting" })),
                React.createElement("div", { className: "flex items-center justify-between" },
                    React.createElement(label_1.Label, { htmlFor: "crossPromote", className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.Share2, { className: "h-4 w-4" }),
                        "Cross-Promote"),
                    React.createElement(switch_1.Switch, { id: "crossPromote", checked: settings.crossPromote, onCheckedChange: (checked) => setSettings(Object.assign(Object.assign({}, settings), { crossPromote: checked })), "data-testid": "switch-cross-promote" })),
                React.createElement("div", { className: "flex items-center justify-between" },
                    React.createElement(label_1.Label, { htmlFor: "notify", className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.Users, { className: "h-4 w-4" }),
                        "Notify Followers"),
                    React.createElement(switch_1.Switch, { id: "notify", checked: settings.notifyFollowers, onCheckedChange: (checked) => setSettings(Object.assign(Object.assign({}, settings), { notifyFollowers: checked })), "data-testid": "switch-notify" })))),
        React.createElement(button_1.Button, { onClick: () => distributeMutation.mutate(), disabled: distributeMutation.isPending || settings.platforms.length === 0, className: "w-full", size: "lg", "data-testid": "button-distribute" }, distributeMutation.isPending ? (React.createElement(React.Fragment, null,
            React.createElement(lucide_react_1.Loader2, { className: "h-4 w-4 mr-2 animate-spin" }),
            "Distributing...")) : (React.createElement(React.Fragment, null,
            React.createElement(lucide_react_1.Share2, { className: "h-4 w-4 mr-2" }),
            "Distribute to ",
            settings.platforms.length,
            " Platform",
            settings.platforms.length !== 1 ? 's' : '')))));
}
