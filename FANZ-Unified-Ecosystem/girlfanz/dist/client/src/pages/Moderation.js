"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Moderation;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const select_1 = require("@/components/ui/select");
const badge_1 = require("@/components/ui/badge");
const textarea_1 = require("@/components/ui/textarea");
const Sidebar_1 = require("@/components/layout/Sidebar");
const queryClient_1 = require("@/lib/queryClient");
const use_toast_1 = require("@/hooks/use-toast");
const useAuth_1 = require("@/hooks/useAuth");
const authUtils_1 = require("@/lib/authUtils");
const lucide_react_1 = require("lucide-react");
function Moderation() {
    const { user } = (0, useAuth_1.useAuth)();
    const { toast } = (0, use_toast_1.useToast)();
    const queryClient = (0, react_query_1.useQueryClient)();
    const [selectedStatus, setSelectedStatus] = (0, react_1.useState)("all");
    const [reviewNotes, setReviewNotes] = (0, react_1.useState)({});
    // Redirect if not admin
    if ((user === null || user === void 0 ? void 0 : user.role) !== "admin") {
        return (React.createElement("div", { className: "min-h-screen bg-gf-ink text-gf-snow flex items-center justify-center" },
            React.createElement(card_1.Card, { className: "glass-overlay border-gf-smoke/20 p-8" },
                React.createElement("div", { className: "text-center" },
                    React.createElement(lucide_react_1.Shield, { className: "h-16 w-16 mx-auto mb-4 text-error" }),
                    React.createElement("h1", { className: "text-2xl font-bold text-gf-snow mb-2" }, "Access Denied"),
                    React.createElement("p", { className: "text-gf-smoke" }, "You need administrator privileges to access this page.")))));
    }
    const { data: moderationQueue, isLoading } = (0, react_query_1.useQuery)({
        queryKey: ["/api/moderation/queue", selectedStatus === "all" ? "" : selectedStatus],
    });
    const reviewItemMutation = (0, react_query_1.useMutation)({
        mutationFn: async ({ itemId, status, notes }) => {
            const response = await (0, queryClient_1.apiRequest)("PATCH", `/api/moderation/${itemId}`, { status, notes });
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Content review completed successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/moderation/queue"] });
        },
        onError: (error) => {
            if ((0, authUtils_1.isUnauthorizedError)(error)) {
                toast({
                    title: "Unauthorized",
                    description: "You are logged out. Logging in again...",
                    variant: "destructive",
                });
                setTimeout(() => {
                    window.location.href = "/api/login";
                }, 500);
                return;
            }
            toast({
                title: "Error",
                description: "Failed to update moderation status.",
                variant: "destructive",
            });
        },
    });
    const handleReview = (itemId, status) => {
        const notes = reviewNotes[itemId] || "";
        reviewItemMutation.mutate({ itemId, status, notes });
        setReviewNotes(Object.assign(Object.assign({}, reviewNotes), { [itemId]: "" }));
    };
    const getStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "bg-warning";
            case "approved":
                return "bg-success";
            case "rejected":
                return "bg-error";
            case "flagged":
                return "bg-gf-violet";
            default:
                return "bg-gf-smoke";
        }
    };
    const getAIConfidenceColor = (confidence) => {
        if (confidence >= 90)
            return "text-success";
        if (confidence >= 70)
            return "text-warning";
        return "text-error";
    };
    if (isLoading) {
        return (React.createElement("div", { className: "min-h-screen bg-gf-ink text-gf-snow flex items-center justify-center" },
            React.createElement("div", { className: "text-xl" }, "Loading moderation queue...")));
    }
    return (React.createElement("div", { className: "min-h-screen bg-gf-ink text-gf-snow" },
        React.createElement("section", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" },
            React.createElement("div", { className: "grid lg:grid-cols-4 gap-8" },
                React.createElement("div", { className: "lg:col-span-1" },
                    React.createElement(Sidebar_1.Sidebar, null)),
                React.createElement("div", { className: "lg:col-span-3" },
                    React.createElement(card_1.Card, { className: "glass-overlay border-gf-smoke/20" },
                        React.createElement(card_1.CardContent, { className: "p-8" },
                            React.createElement("div", { className: "flex items-center justify-between mb-8" },
                                React.createElement("h2", { className: "font-display font-bold text-2xl text-gf-snow flex items-center" },
                                    React.createElement(lucide_react_1.Shield, { className: "h-8 w-8 mr-3 text-gf-violet" }),
                                    "Content Moderation Queue"),
                                React.createElement("div", { className: "flex items-center space-x-4" },
                                    React.createElement(select_1.Select, { value: selectedStatus, onValueChange: setSelectedStatus },
                                        React.createElement(select_1.SelectTrigger, { className: "bg-gf-graphite border-gf-smoke/20 text-gf-snow w-48" },
                                            React.createElement(select_1.SelectValue, null)),
                                        React.createElement(select_1.SelectContent, { className: "bg-gf-graphite border-gf-smoke/20" },
                                            React.createElement(select_1.SelectItem, { value: "all" }, "All Content"),
                                            React.createElement(select_1.SelectItem, { value: "pending" }, "Pending Review"),
                                            React.createElement(select_1.SelectItem, { value: "flagged" }, "Flagged Content"),
                                            React.createElement(select_1.SelectItem, { value: "approved" }, "Approved"),
                                            React.createElement(select_1.SelectItem, { value: "rejected" }, "Rejected"))),
                                    React.createElement("div", { className: "flex items-center space-x-2 text-sm text-gf-smoke" },
                                        React.createElement("span", null, "Queue Status:"),
                                        React.createElement("div", { className: "flex items-center" },
                                            React.createElement("div", { className: "w-2 h-2 bg-warning rounded-full mr-1" }),
                                            React.createElement("span", { "data-testid": "queue-count" },
                                                (moderationQueue === null || moderationQueue === void 0 ? void 0 : moderationQueue.filter((item) => item.status === 'pending').length) || 0,
                                                " pending"))))),
                            React.createElement("div", { className: "space-y-4" }, moderationQueue && moderationQueue.length > 0 ? (moderationQueue.map((item) => {
                                var _a, _b, _c, _d, _e, _f;
                                return (React.createElement(card_1.Card, { key: item.id, className: "glass-overlay border-gf-smoke/10" },
                                    React.createElement(card_1.CardContent, { className: "p-6" },
                                        React.createElement("div", { className: "grid lg:grid-cols-4 gap-6 items-center" },
                                            React.createElement("div", { className: "lg:col-span-1" },
                                                React.createElement("div", { className: "relative rounded-lg overflow-hidden" },
                                                    React.createElement("div", { className: "w-full h-32 bg-gradient-to-br from-gf-pink/20 to-gf-violet/20 flex items-center justify-center" },
                                                        React.createElement(lucide_react_1.Image, { className: "h-16 w-16 text-gf-smoke" })),
                                                    React.createElement("div", { className: "absolute top-2 left-2" },
                                                        React.createElement(badge_1.Badge, { className: `${getStatusColor(item.status)} text-xs px-2 py-1 text-gf-snow` }, item.status)))),
                                            React.createElement("div", { className: "lg:col-span-2 space-y-3" },
                                                React.createElement("div", { className: "flex items-center space-x-4" },
                                                    React.createElement("h3", { className: "font-semibold text-gf-snow", "data-testid": `content-title-${item.id}` }, ((_a = item.media) === null || _a === void 0 ? void 0 : _a.title) || "Untitled Content"),
                                                    React.createElement(badge_1.Badge, { className: "text-xs bg-gf-violet px-2 py-1 text-gf-snow" }, ((_c = (_b = item.media) === null || _b === void 0 ? void 0 : _b.mimeType) === null || _c === void 0 ? void 0 : _c.split('/')[0]) || "media")),
                                                React.createElement("div", { className: "flex items-center space-x-4 text-sm text-gf-smoke" },
                                                    React.createElement("span", null,
                                                        "Creator: ",
                                                        React.createElement("span", { className: "text-gf-pink" },
                                                            "User ", (_e = (_d = item.media) === null || _d === void 0 ? void 0 : _d.ownerId) === null || _e === void 0 ? void 0 :
                                                            _e.slice(-4))),
                                                    React.createElement("span", null,
                                                        "Uploaded: ",
                                                        React.createElement("span", null, new Date(item.createdAt).toLocaleDateString())),
                                                    React.createElement("span", null,
                                                        "Reports: ",
                                                        React.createElement("span", { className: "text-warning" }, item.reportCount || 0))),
                                                React.createElement("p", { className: "text-sm text-gf-smoke" }, ((_f = item.media) === null || _f === void 0 ? void 0 : _f.description) || "No description provided"),
                                                React.createElement("div", { className: "flex items-center space-x-2" },
                                                    React.createElement("span", { className: "text-xs text-gf-smoke" }, "AI Confidence:"),
                                                    React.createElement("div", { className: "flex-1 bg-gf-graphite rounded-full h-2 max-w-32" },
                                                        React.createElement("div", { className: `h-2 rounded-full ${item.aiConfidence >= 90 ? 'bg-success' :
                                                                item.aiConfidence >= 70 ? 'bg-warning' : 'bg-error'}`, style: { width: `${item.aiConfidence || 0}%` } })),
                                                    React.createElement("span", { className: `text-xs ${getAIConfidenceColor(item.aiConfidence || 0)}` },
                                                        item.aiConfidence || 0,
                                                        "% Safe")),
                                                item.status === 'pending' && (React.createElement("div", { className: "mt-4" },
                                                    React.createElement(textarea_1.Textarea, { placeholder: "Add review notes (optional)...", value: reviewNotes[item.id] || "", onChange: (e) => setReviewNotes(Object.assign(Object.assign({}, reviewNotes), { [item.id]: e.target.value })), className: "bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke text-sm h-20", "data-testid": `textarea-notes-${item.id}` })))),
                                            React.createElement("div", { className: "lg:col-span-1 flex flex-col space-y-3" },
                                                item.status === 'pending' ? (React.createElement(React.Fragment, null,
                                                    React.createElement(button_1.Button, { onClick: () => handleReview(item.id, 'approved'), disabled: reviewItemMutation.isPending, className: "bg-success text-gf-snow hover:bg-success/80", "data-testid": `button-approve-${item.id}` },
                                                        React.createElement(lucide_react_1.Check, { className: "h-4 w-4 mr-2" }),
                                                        "Approve"),
                                                    React.createElement(button_1.Button, { onClick: () => handleReview(item.id, 'rejected'), disabled: reviewItemMutation.isPending, className: "bg-error text-gf-snow hover:bg-error/80", "data-testid": `button-reject-${item.id}` },
                                                        React.createElement(lucide_react_1.X, { className: "h-4 w-4 mr-2" }),
                                                        "Reject"),
                                                    React.createElement(button_1.Button, { onClick: () => handleReview(item.id, 'flagged'), disabled: reviewItemMutation.isPending, className: "bg-warning text-gf-ink hover:bg-warning/80", "data-testid": `button-flag-${item.id}` },
                                                        React.createElement(lucide_react_1.Flag, { className: "h-4 w-4 mr-2" }),
                                                        "Flag"))) : (React.createElement("div", { className: "text-center" },
                                                    React.createElement(badge_1.Badge, { className: `${getStatusColor(item.status)} text-sm px-3 py-2 text-gf-snow` }, item.status.charAt(0).toUpperCase() + item.status.slice(1)),
                                                    item.reviewedAt && (React.createElement("p", { className: "text-xs text-gf-smoke mt-2" },
                                                        "Reviewed: ",
                                                        new Date(item.reviewedAt).toLocaleDateString())))),
                                                React.createElement(button_1.Button, { variant: "outline", className: "text-gf-cyan hover:text-gf-violet border-gf-cyan/20 hover:border-gf-violet/20", "data-testid": `button-details-${item.id}` },
                                                    React.createElement(lucide_react_1.Eye, { className: "h-4 w-4 mr-2" }),
                                                    "View Details"))))));
                            })) : (React.createElement("div", { className: "text-center py-12" },
                                React.createElement(lucide_react_1.Shield, { className: "h-16 w-16 mx-auto mb-4 text-gf-smoke" }),
                                React.createElement("h3", { className: "text-xl font-semibold text-gf-snow mb-2" }, "No Content to Review"),
                                React.createElement("p", { className: "text-gf-smoke" }, selectedStatus === "all"
                                    ? "The moderation queue is empty."
                                    : `No ${selectedStatus} content found.`)))))))))));
}
