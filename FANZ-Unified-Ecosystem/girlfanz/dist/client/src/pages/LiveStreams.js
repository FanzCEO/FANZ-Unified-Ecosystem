"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LiveStreams;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const input_1 = require("@/components/ui/input");
const textarea_1 = require("@/components/ui/textarea");
const use_toast_1 = require("@/hooks/use-toast");
const dialog_1 = require("@/components/ui/dialog");
const lucide_react_1 = require("lucide-react");
const date_fns_1 = require("date-fns");
const queryClient_1 = require("@/lib/queryClient");
function LiveStreams() {
    const { toast } = (0, use_toast_1.useToast)();
    const [isCreateOpen, setIsCreateOpen] = (0, react_1.useState)(false);
    const [filter, setFilter] = (0, react_1.useState)('all');
    // Fetch streams
    const { data: streams = [], isLoading } = (0, react_query_1.useQuery)({
        queryKey: ['/api/streams', filter],
    });
    // Create stream mutation
    const createStreamMutation = (0, react_query_1.useMutation)({
        mutationFn: async (data) => {
            const response = await (0, queryClient_1.apiRequest)("POST", "/api/streams", data);
            return response.json();
        },
        onSuccess: () => {
            setIsCreateOpen(false);
            queryClient_1.queryClient.invalidateQueries({ queryKey: ['/api/streams'] });
            toast({
                title: "Stream created",
                description: "Your live stream has been scheduled",
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to create stream",
                variant: "destructive",
            });
        },
    });
    const liveStreams = streams.filter(s => s.status === 'live');
    const scheduledStreams = streams.filter(s => s.status === 'scheduled');
    const endedStreams = streams.filter(s => s.status === 'ended');
    const getStatusColor = (status) => {
        switch (status) {
            case 'live':
                return 'bg-red-500 animate-pulse';
            case 'scheduled':
                return 'bg-blue-500';
            case 'ended':
                return 'bg-gray-500';
            default:
                return 'bg-gray-500';
        }
    };
    const StreamCard = ({ stream }) => (React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20 overflow-hidden hover:border-gf-cyber/50 transition-colors", "data-testid": `card-stream-${stream.id}` },
        React.createElement("div", { className: "relative" },
            React.createElement("img", { src: stream.thumbnailUrl || '/placeholder-stream.jpg', alt: stream.title, className: "w-full h-48 object-cover" }),
            React.createElement(badge_1.Badge, { className: `absolute top-2 left-2 ${getStatusColor(stream.status)} text-white` },
                stream.status === 'live' && React.createElement(lucide_react_1.Radio, { className: "h-3 w-3 mr-1" }),
                stream.status.toUpperCase()),
            stream.status === 'live' && (React.createElement(badge_1.Badge, { className: "absolute top-2 right-2 bg-black/70 text-white" },
                React.createElement(lucide_react_1.Users, { className: "h-3 w-3 mr-1" }),
                stream.viewerCount)),
            stream.priceInCents && stream.priceInCents > 0 && (React.createElement(badge_1.Badge, { className: "absolute bottom-2 right-2 bg-gf-cyber text-white" },
                React.createElement(lucide_react_1.DollarSign, { className: "h-3 w-3 mr-1" }),
                "$",
                (stream.priceInCents / 100).toFixed(2)))),
        React.createElement(card_1.CardContent, { className: "p-4" },
            React.createElement("div", { className: "flex items-start gap-3 mb-3" },
                React.createElement("img", { src: stream.creator.avatarUrl, alt: stream.creator.displayName, className: "h-10 w-10 rounded-full object-cover" }),
                React.createElement("div", { className: "flex-1 min-w-0" },
                    React.createElement("h3", { className: "text-gf-snow font-semibold truncate" }, stream.title),
                    React.createElement("p", { className: "text-gf-steel text-sm" },
                        "@",
                        stream.creator.username))),
            stream.description && (React.createElement("p", { className: "text-gf-steel text-sm line-clamp-2 mb-3" }, stream.description)),
            React.createElement("div", { className: "flex items-center justify-between text-xs text-gf-steel mb-3" }, stream.status === 'scheduled' && stream.scheduledAt ? (React.createElement("div", { className: "flex items-center gap-1" },
                React.createElement(lucide_react_1.Calendar, { className: "h-3 w-3" }),
                (0, date_fns_1.formatDistanceToNow)(new Date(stream.scheduledAt), { addSuffix: true }))) : stream.status === 'live' ? (React.createElement("div", { className: "flex items-center gap-1" },
                React.createElement(lucide_react_1.Clock, { className: "h-3 w-3" }),
                "Live now")) : (React.createElement("div", { className: "flex items-center gap-1" },
                React.createElement(lucide_react_1.Eye, { className: "h-3 w-3" }),
                stream.totalViews,
                " views"))),
            React.createElement(button_1.Button, { className: `w-full ${stream.status === 'live'
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:opacity-90'
                    : 'bg-gradient-to-r from-gf-cyber to-gf-pink hover:opacity-90'}`, "data-testid": `button-watch-stream-${stream.id}` }, stream.status === 'live' ? (React.createElement(React.Fragment, null,
                React.createElement(lucide_react_1.Play, { className: "h-4 w-4 mr-2" }),
                "Watch Live")) : stream.status === 'scheduled' ? (React.createElement(React.Fragment, null,
                React.createElement(lucide_react_1.Calendar, { className: "h-4 w-4 mr-2" }),
                "Set Reminder")) : (React.createElement(React.Fragment, null,
                React.createElement(lucide_react_1.Video, { className: "h-4 w-4 mr-2" }),
                "Watch Replay"))))));
    if (isLoading) {
        return (React.createElement("div", { className: "min-h-screen bg-gf-ink text-gf-snow p-6" },
            React.createElement("div", { className: "max-w-7xl mx-auto" },
                React.createElement("div", { className: "animate-pulse space-y-4" },
                    React.createElement("div", { className: "h-8 bg-gf-charcoal/50 rounded w-1/4" }),
                    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" }, [1, 2, 3, 4, 5, 6].map(i => (React.createElement("div", { key: i, className: "h-80 bg-gf-charcoal/50 rounded" }))))))));
    }
    return (React.createElement("div", { className: "min-h-screen bg-gf-ink text-gf-snow p-6" },
        React.createElement("div", { className: "max-w-7xl mx-auto space-y-6" },
            React.createElement("div", { className: "flex items-center justify-between" },
                React.createElement("div", null,
                    React.createElement("h1", { className: "text-3xl font-bold bg-gradient-to-r from-gf-cyber to-gf-pink bg-clip-text text-transparent", "data-testid": "text-streams-title" }, "Live Streams"),
                    React.createElement("p", { className: "text-gf-steel mt-1" }, "Watch creators live or catch up on replays")),
                React.createElement(dialog_1.Dialog, { open: isCreateOpen, onOpenChange: setIsCreateOpen },
                    React.createElement(dialog_1.DialogTrigger, { asChild: true },
                        React.createElement(button_1.Button, { className: "bg-gradient-to-r from-red-500 to-pink-500 hover:opacity-90", "data-testid": "button-create-stream" },
                            React.createElement(lucide_react_1.Radio, { className: "h-4 w-4 mr-2" }),
                            "Go Live")),
                    React.createElement(dialog_1.DialogContent, { className: "bg-gf-charcoal border-gf-steel/20 text-gf-snow" },
                        React.createElement(dialog_1.DialogHeader, null,
                            React.createElement(dialog_1.DialogTitle, null, "Create Live Stream"),
                            React.createElement(dialog_1.DialogDescription, { className: "text-gf-steel" }, "Set up your live stream details")),
                        React.createElement("form", { onSubmit: (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                createStreamMutation.mutate({
                                    title: formData.get('title'),
                                    description: formData.get('description'),
                                    visibility: formData.get('visibility'),
                                    priceInCents: formData.get('price') ? parseInt(formData.get('price')) * 100 : undefined,
                                });
                            }, className: "space-y-4" },
                            React.createElement("div", null,
                                React.createElement("label", { className: "text-sm font-medium" }, "Title"),
                                React.createElement(input_1.Input, { name: "title", required: true, placeholder: "My Amazing Stream", className: "bg-gf-ink border-gf-steel/20" })),
                            React.createElement("div", null,
                                React.createElement("label", { className: "text-sm font-medium" }, "Description"),
                                React.createElement(textarea_1.Textarea, { name: "description", placeholder: "What will you be streaming?", className: "bg-gf-ink border-gf-steel/20" })),
                            React.createElement("div", null,
                                React.createElement("label", { className: "text-sm font-medium" }, "Visibility"),
                                React.createElement("select", { name: "visibility", className: "w-full p-2 rounded bg-gf-ink border border-gf-steel/20" },
                                    React.createElement("option", { value: "free" }, "Free (Anyone)"),
                                    React.createElement("option", { value: "subscriber" }, "Subscribers Only"),
                                    React.createElement("option", { value: "paid" }, "Pay-Per-View"))),
                            React.createElement("div", null,
                                React.createElement("label", { className: "text-sm font-medium" }, "Price (PPV only)"),
                                React.createElement(input_1.Input, { name: "price", type: "number", step: "0.01", min: "0", placeholder: "0.00", className: "bg-gf-ink border-gf-steel/20" })),
                            React.createElement(button_1.Button, { type: "submit", className: "w-full bg-gradient-to-r from-gf-cyber to-gf-pink", disabled: createStreamMutation.isPending }, createStreamMutation.isPending ? "Creating..." : "Create Stream"))))),
            React.createElement("div", { className: "flex gap-2" },
                React.createElement(button_1.Button, { variant: filter === 'all' ? 'default' : 'outline', onClick: () => setFilter('all'), className: filter === 'all' ? 'bg-gf-cyber' : 'border-gf-steel/20', "data-testid": "button-filter-all" }, "All Streams"),
                React.createElement(button_1.Button, { variant: filter === 'live' ? 'default' : 'outline', onClick: () => setFilter('live'), className: filter === 'live' ? 'bg-red-500' : 'border-gf-steel/20', "data-testid": "button-filter-live" },
                    React.createElement(lucide_react_1.Radio, { className: "h-4 w-4 mr-2" }),
                    "Live (",
                    liveStreams.length,
                    ")"),
                React.createElement(button_1.Button, { variant: filter === 'scheduled' ? 'default' : 'outline', onClick: () => setFilter('scheduled'), className: filter === 'scheduled' ? 'bg-blue-500' : 'border-gf-steel/20', "data-testid": "button-filter-scheduled" },
                    React.createElement(lucide_react_1.Calendar, { className: "h-4 w-4 mr-2" }),
                    "Scheduled (",
                    scheduledStreams.length,
                    ")")),
            streams.length === 0 ? (React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20" },
                React.createElement(card_1.CardContent, { className: "p-12 text-center" },
                    React.createElement(lucide_react_1.Video, { className: "h-12 w-12 text-gf-steel mx-auto mb-4" }),
                    React.createElement("h3", { className: "text-gf-snow font-semibold mb-2" }, "No streams found"),
                    React.createElement("p", { className: "text-gf-steel" }, "Check back later for live content!")))) : (React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" }, streams.map(stream => (React.createElement(StreamCard, { key: stream.id, stream: stream }))))))));
}
