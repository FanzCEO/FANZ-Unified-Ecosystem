"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Dashboard;
const react_query_1 = require("@tanstack/react-query");
const card_1 = require("@/components/ui/card");
const lucide_react_1 = require("lucide-react");
const MediaUpload_1 = require("@/components/media/MediaUpload");
const Sidebar_1 = require("@/components/layout/Sidebar");
function Dashboard() {
    const { data: stats, isLoading: statsLoading } = (0, react_query_1.useQuery)({
        queryKey: ["/api/stats"],
    });
    const { data: recentMedia, isLoading: mediaLoading } = (0, react_query_1.useQuery)({
        queryKey: ["/api/media"],
    });
    if (statsLoading) {
        return (React.createElement("div", { className: "min-h-screen bg-gf-ink text-gf-snow flex items-center justify-center" },
            React.createElement("div", { className: "text-xl" }, "Loading dashboard...")));
    }
    const statCards = [
        {
            title: "Total Earnings",
            value: `$${(((stats === null || stats === void 0 ? void 0 : stats.totalEarnings) || 0) / 100).toLocaleString()}`,
            icon: lucide_react_1.DollarSign,
            color: "text-success",
        },
        {
            title: "Active Fans",
            value: ((stats === null || stats === void 0 ? void 0 : stats.fanCount) || 0).toLocaleString(),
            icon: lucide_react_1.Users,
            color: "text-gf-pink",
        },
        {
            title: "Content Posts",
            value: ((stats === null || stats === void 0 ? void 0 : stats.contentPosts) || 0).toLocaleString(),
            icon: lucide_react_1.Image,
            color: "text-gf-violet",
        },
        {
            title: "Engagement",
            value: `${(stats === null || stats === void 0 ? void 0 : stats.engagement) || 0}%`,
            icon: lucide_react_1.Heart,
            color: "text-gf-cyan",
        },
    ];
    return (React.createElement("div", { className: "min-h-screen bg-gf-ink text-gf-snow" },
        React.createElement("section", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" },
            React.createElement("div", { className: "grid lg:grid-cols-4 gap-8" },
                React.createElement("div", { className: "lg:col-span-1" },
                    React.createElement(Sidebar_1.Sidebar, null)),
                React.createElement("div", { className: "lg:col-span-3 space-y-8" },
                    React.createElement("div", { className: "grid md:grid-cols-4 gap-6" }, statCards.map((stat, index) => {
                        const Icon = stat.icon;
                        return (React.createElement(card_1.Card, { key: index, className: "glass-overlay border-gf-smoke/20" },
                            React.createElement(card_1.CardContent, { className: "p-6" },
                                React.createElement("div", { className: "flex items-center justify-between" },
                                    React.createElement("div", null,
                                        React.createElement("p", { className: "text-gf-smoke text-sm" }, stat.title),
                                        React.createElement("p", { className: `font-display font-bold text-2xl ${stat.color}`, "data-testid": `stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}` }, stat.value)),
                                    React.createElement(Icon, { className: `h-8 w-8 ${stat.color}` })))));
                    })),
                    React.createElement(MediaUpload_1.MediaUpload, null),
                    React.createElement(card_1.Card, { className: "glass-overlay border-gf-smoke/20" },
                        React.createElement(card_1.CardContent, { className: "p-8" },
                            React.createElement("div", { className: "flex items-center justify-between mb-6" },
                                React.createElement("h2", { className: "font-display font-bold text-2xl text-gf-snow" }, "Your Recent Content"),
                                React.createElement("button", { className: "text-gf-pink hover:text-gf-violet transition-colors" }, "View All")),
                            mediaLoading ? (React.createElement("div", { className: "text-center py-8 text-gf-smoke" }, "Loading content...")) : recentMedia && recentMedia.length > 0 ? (React.createElement("div", { className: "grid md:grid-cols-3 gap-6" }, recentMedia.slice(0, 3).map((content) => (React.createElement(card_1.Card, { key: content.id, className: "glass-overlay border-gf-smoke/20 overflow-hidden group cursor-pointer" },
                                React.createElement("div", { className: "relative" },
                                    React.createElement("div", { className: "w-full h-48 bg-gradient-to-br from-gf-pink/20 to-gf-violet/20 flex items-center justify-center" },
                                        React.createElement(lucide_react_1.Image, { className: "h-16 w-16 text-gf-smoke" })),
                                    React.createElement("div", { className: "absolute inset-0 bg-gf-pink/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" },
                                        React.createElement("div", { className: "text-4xl text-gf-snow" }, "\u25B6")),
                                    React.createElement("div", { className: "absolute top-3 right-3 bg-success text-xs px-2 py-1 rounded-full" }, content.status)),
                                React.createElement(card_1.CardContent, { className: "p-4" },
                                    React.createElement("p", { className: "text-gf-snow text-sm mb-2", "data-testid": `content-title-${content.id}` }, content.title || "Untitled"),
                                    React.createElement("div", { className: "flex items-center justify-between text-xs text-gf-smoke" },
                                        React.createElement("span", { "data-testid": `content-views-${content.id}` },
                                            content.views || 0,
                                            " views"),
                                        React.createElement("span", { "data-testid": `content-earnings-${content.id}` }, content.price ? `$${(content.price / 100).toFixed(2)}` : "Free")))))))) : (React.createElement("div", { className: "text-center py-8 text-gf-smoke" }, "No content yet. Upload your first post to get started!")))))))));
}
