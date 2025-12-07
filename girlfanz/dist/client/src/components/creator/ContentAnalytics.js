"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ContentAnalytics;
const card_1 = require("@/components/ui/card");
const tabs_1 = require("@/components/ui/tabs");
const badge_1 = require("@/components/ui/badge");
const progress_1 = require("@/components/ui/progress");
const lucide_react_1 = require("lucide-react");
function ContentAnalytics({ sessions }) {
    var _a, _b, _c, _d;
    // Calculate analytics
    const getOverallStats = () => {
        const totalViews = sessions.reduce((acc, s) => { var _a; return acc + (((_a = s.analytics) === null || _a === void 0 ? void 0 : _a.views) || 0); }, 0);
        const totalLikes = sessions.reduce((acc, s) => { var _a; return acc + (((_a = s.analytics) === null || _a === void 0 ? void 0 : _a.likes) || 0); }, 0);
        const totalShares = sessions.reduce((acc, s) => { var _a; return acc + (((_a = s.analytics) === null || _a === void 0 ? void 0 : _a.shares) || 0); }, 0);
        const totalRevenue = sessions.reduce((acc, s) => { var _a; return acc + (((_a = s.analytics) === null || _a === void 0 ? void 0 : _a.revenue) || 0); }, 0);
        const avgEngagement = sessions.length > 0
            ? ((totalLikes + totalShares) / totalViews * 100).toFixed(2)
            : '0';
        const bestPerforming = sessions.reduce((best, current) => {
            var _a, _b;
            const currentViews = ((_a = current.analytics) === null || _a === void 0 ? void 0 : _a.views) || 0;
            const bestViews = ((_b = best === null || best === void 0 ? void 0 : best.analytics) === null || _b === void 0 ? void 0 : _b.views) || 0;
            return currentViews > bestViews ? current : best;
        }, sessions[0]);
        return {
            totalViews,
            totalLikes,
            totalShares,
            totalRevenue,
            avgEngagement,
            bestPerforming,
        };
    };
    const getTimeBasedStats = () => {
        const now = new Date();
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const recent7 = sessions.filter(s => new Date(s.createdAt) > last7Days);
        const recent30 = sessions.filter(s => new Date(s.createdAt) > last30Days);
        return {
            last7Days: {
                count: recent7.length,
                views: recent7.reduce((acc, s) => { var _a; return acc + (((_a = s.analytics) === null || _a === void 0 ? void 0 : _a.views) || 0); }, 0),
                revenue: recent7.reduce((acc, s) => { var _a; return acc + (((_a = s.analytics) === null || _a === void 0 ? void 0 : _a.revenue) || 0); }, 0),
            },
            last30Days: {
                count: recent30.length,
                views: recent30.reduce((acc, s) => { var _a; return acc + (((_a = s.analytics) === null || _a === void 0 ? void 0 : _a.views) || 0); }, 0),
                revenue: recent30.reduce((acc, s) => { var _a; return acc + (((_a = s.analytics) === null || _a === void 0 ? void 0 : _a.revenue) || 0); }, 0),
            },
        };
    };
    const getPlatformBreakdown = () => {
        // Mock data for platform breakdown
        return [
            { platform: 'Instagram', views: 45200, revenue: 3240, growth: 12.5 },
            { platform: 'TikTok', views: 38900, revenue: 2890, growth: 28.3 },
            { platform: 'Twitter', views: 12300, revenue: 890, growth: -5.2 },
            { platform: 'OnlyFans', views: 8900, revenue: 6780, growth: 45.7 },
        ];
    };
    const getContentPerformance = () => {
        return sessions
            .filter(s => s.analytics)
            .sort((a, b) => { var _a, _b; return (((_a = b.analytics) === null || _a === void 0 ? void 0 : _a.views) || 0) - (((_b = a.analytics) === null || _b === void 0 ? void 0 : _b.views) || 0); })
            .slice(0, 5);
    };
    const stats = getOverallStats();
    const timeStats = getTimeBasedStats();
    const platforms = getPlatformBreakdown();
    const topContent = getContentPerformance();
    const getTrendIcon = (value) => {
        if (value > 0)
            return React.createElement(lucide_react_1.ArrowUp, { className: "h-4 w-4 text-green-500" });
        if (value < 0)
            return React.createElement(lucide_react_1.ArrowDown, { className: "h-4 w-4 text-red-500" });
        return React.createElement(lucide_react_1.Minus, { className: "h-4 w-4 text-gray-500" });
    };
    return (React.createElement("div", { className: "space-y-6" },
        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4" },
            React.createElement(card_1.Card, null,
                React.createElement(card_1.CardHeader, { className: "pb-3" },
                    React.createElement(card_1.CardTitle, { className: "text-sm font-medium flex items-center gap-2" },
                        React.createElement(lucide_react_1.Eye, { className: "h-4 w-4" }),
                        "Total Views")),
                React.createElement(card_1.CardContent, null,
                    React.createElement("div", { className: "text-2xl font-bold", "data-testid": "stat-total-views" }, stats.totalViews.toLocaleString()),
                    React.createElement("p", { className: "text-xs text-muted-foreground mt-1" }, "+12.5% from last week"))),
            React.createElement(card_1.Card, null,
                React.createElement(card_1.CardHeader, { className: "pb-3" },
                    React.createElement(card_1.CardTitle, { className: "text-sm font-medium flex items-center gap-2" },
                        React.createElement(lucide_react_1.Heart, { className: "h-4 w-4" }),
                        "Total Engagement")),
                React.createElement(card_1.CardContent, null,
                    React.createElement("div", { className: "text-2xl font-bold", "data-testid": "stat-engagement" }, (stats.totalLikes + stats.totalShares).toLocaleString()),
                    React.createElement("p", { className: "text-xs text-muted-foreground mt-1" },
                        stats.avgEngagement,
                        "% avg rate"))),
            React.createElement(card_1.Card, null,
                React.createElement(card_1.CardHeader, { className: "pb-3" },
                    React.createElement(card_1.CardTitle, { className: "text-sm font-medium flex items-center gap-2" },
                        React.createElement(lucide_react_1.DollarSign, { className: "h-4 w-4" }),
                        "Total Revenue")),
                React.createElement(card_1.CardContent, null,
                    React.createElement("div", { className: "text-2xl font-bold", "data-testid": "stat-revenue" },
                        "$",
                        (stats.totalRevenue / 100).toFixed(2)),
                    React.createElement("p", { className: "text-xs text-muted-foreground mt-1" }, "+28.3% from last month"))),
            React.createElement(card_1.Card, null,
                React.createElement(card_1.CardHeader, { className: "pb-3" },
                    React.createElement(card_1.CardTitle, { className: "text-sm font-medium flex items-center gap-2" },
                        React.createElement(lucide_react_1.TrendingUp, { className: "h-4 w-4" }),
                        "Conversion Rate")),
                React.createElement(card_1.CardContent, null,
                    React.createElement("div", { className: "text-2xl font-bold", "data-testid": "stat-conversion" }, "4.2%"),
                    React.createElement("p", { className: "text-xs text-muted-foreground mt-1" }, "Views to paid conversions")))),
        React.createElement(tabs_1.Tabs, { defaultValue: "overview" },
            React.createElement(tabs_1.TabsList, { className: "grid w-full grid-cols-3" },
                React.createElement(tabs_1.TabsTrigger, { value: "overview", "data-testid": "tab-overview" }, "Overview"),
                React.createElement(tabs_1.TabsTrigger, { value: "platforms", "data-testid": "tab-platforms" }, "Platforms"),
                React.createElement(tabs_1.TabsTrigger, { value: "content", "data-testid": "tab-content" }, "Top Content")),
            React.createElement(tabs_1.TabsContent, { value: "overview", className: "space-y-4" },
                React.createElement(card_1.Card, null,
                    React.createElement(card_1.CardHeader, null,
                        React.createElement(card_1.CardTitle, null, "Performance Trends"),
                        React.createElement(card_1.CardDescription, null, "Your content performance over time")),
                    React.createElement(card_1.CardContent, { className: "space-y-4" },
                        React.createElement("div", { className: "grid grid-cols-2 gap-4" },
                            React.createElement("div", { className: "space-y-2" },
                                React.createElement("div", { className: "flex items-center justify-between" },
                                    React.createElement("span", { className: "text-sm font-medium" }, "Last 7 Days"),
                                    React.createElement(badge_1.Badge, { variant: "outline", "data-testid": "badge-7days" },
                                        timeStats.last7Days.count,
                                        " posts")),
                                React.createElement("div", { className: "space-y-1" },
                                    React.createElement("div", { className: "flex justify-between text-sm" },
                                        React.createElement("span", { className: "text-muted-foreground" }, "Views"),
                                        React.createElement("span", { className: "font-medium" }, timeStats.last7Days.views.toLocaleString())),
                                    React.createElement("div", { className: "flex justify-between text-sm" },
                                        React.createElement("span", { className: "text-muted-foreground" }, "Revenue"),
                                        React.createElement("span", { className: "font-medium" },
                                            "$",
                                            (timeStats.last7Days.revenue / 100).toFixed(2))))),
                            React.createElement("div", { className: "space-y-2" },
                                React.createElement("div", { className: "flex items-center justify-between" },
                                    React.createElement("span", { className: "text-sm font-medium" }, "Last 30 Days"),
                                    React.createElement(badge_1.Badge, { variant: "outline", "data-testid": "badge-30days" },
                                        timeStats.last30Days.count,
                                        " posts")),
                                React.createElement("div", { className: "space-y-1" },
                                    React.createElement("div", { className: "flex justify-between text-sm" },
                                        React.createElement("span", { className: "text-muted-foreground" }, "Views"),
                                        React.createElement("span", { className: "font-medium" }, timeStats.last30Days.views.toLocaleString())),
                                    React.createElement("div", { className: "flex justify-between text-sm" },
                                        React.createElement("span", { className: "text-muted-foreground" }, "Revenue"),
                                        React.createElement("span", { className: "font-medium" },
                                            "$",
                                            (timeStats.last30Days.revenue / 100).toFixed(2)))))),
                        React.createElement("div", { className: "h-48 bg-muted/20 rounded-lg flex items-center justify-center" },
                            React.createElement(lucide_react_1.BarChart, { className: "h-12 w-12 text-muted-foreground" }),
                            React.createElement("span", { className: "ml-2 text-muted-foreground" }, "Chart visualization")))),
                stats.bestPerforming && (React.createElement(card_1.Card, null,
                    React.createElement(card_1.CardHeader, null,
                        React.createElement(card_1.CardTitle, null, "Best Performing Content"),
                        React.createElement(card_1.CardDescription, null, "Your top content this month")),
                    React.createElement(card_1.CardContent, null,
                        React.createElement("div", { className: "space-y-2" },
                            React.createElement("h3", { className: "font-medium", "data-testid": "best-content-title" }, stats.bestPerforming.title),
                            React.createElement("div", { className: "flex gap-4 text-sm" },
                                React.createElement("span", { className: "flex items-center gap-1" },
                                    React.createElement(lucide_react_1.Eye, { className: "h-3 w-3" }),
                                    ((_a = stats.bestPerforming.analytics) === null || _a === void 0 ? void 0 : _a.views) || 0),
                                React.createElement("span", { className: "flex items-center gap-1" },
                                    React.createElement(lucide_react_1.Heart, { className: "h-3 w-3" }),
                                    ((_b = stats.bestPerforming.analytics) === null || _b === void 0 ? void 0 : _b.likes) || 0),
                                React.createElement("span", { className: "flex items-center gap-1" },
                                    React.createElement(lucide_react_1.Share2, { className: "h-3 w-3" }),
                                    ((_c = stats.bestPerforming.analytics) === null || _c === void 0 ? void 0 : _c.shares) || 0),
                                React.createElement("span", { className: "flex items-center gap-1" },
                                    React.createElement(lucide_react_1.DollarSign, { className: "h-3 w-3" }),
                                    "$",
                                    ((((_d = stats.bestPerforming.analytics) === null || _d === void 0 ? void 0 : _d.revenue) || 0) / 100).toFixed(2)))))))),
            React.createElement(tabs_1.TabsContent, { value: "platforms", className: "space-y-4" },
                React.createElement(card_1.Card, null,
                    React.createElement(card_1.CardHeader, null,
                        React.createElement(card_1.CardTitle, null, "Platform Performance"),
                        React.createElement(card_1.CardDescription, null, "Performance breakdown by platform")),
                    React.createElement(card_1.CardContent, { className: "space-y-4" }, platforms.map((platform) => (React.createElement("div", { key: platform.platform, className: "space-y-2", "data-testid": `platform-${platform.platform}` },
                        React.createElement("div", { className: "flex items-center justify-between" },
                            React.createElement("div", { className: "flex items-center gap-2" },
                                React.createElement("span", { className: "font-medium" }, platform.platform),
                                React.createElement("div", { className: "flex items-center gap-1" },
                                    getTrendIcon(platform.growth),
                                    React.createElement("span", { className: cn("text-xs", platform.growth > 0 && "text-green-500", platform.growth < 0 && "text-red-500", platform.growth === 0 && "text-gray-500") },
                                        Math.abs(platform.growth),
                                        "%"))),
                            React.createElement("span", { className: "text-sm text-muted-foreground" },
                                "$",
                                (platform.revenue / 100).toFixed(2))),
                        React.createElement("div", { className: "space-y-1" },
                            React.createElement(progress_1.Progress, { value: (platform.views / 100000) * 100, className: "h-2" }),
                            React.createElement("div", { className: "flex justify-between text-xs text-muted-foreground" },
                                React.createElement("span", null,
                                    platform.views.toLocaleString(),
                                    " views"),
                                React.createElement("span", null,
                                    ((platform.revenue / platform.views) * 100).toFixed(2),
                                    "\u00A2 per view")))))))),
                React.createElement(card_1.Card, null,
                    React.createElement(card_1.CardHeader, null,
                        React.createElement(card_1.CardTitle, null, "AI Recommendations"),
                        React.createElement(card_1.CardDescription, null, "Optimization suggestions based on your data")),
                    React.createElement(card_1.CardContent, { className: "space-y-3" },
                        React.createElement("div", { className: "flex items-start gap-2" },
                            React.createElement(badge_1.Badge, { className: "mt-0.5" }, "TIP"),
                            React.createElement("p", { className: "text-sm" }, "Your TikTok content is growing fastest. Consider posting more frequently there.")),
                        React.createElement("div", { className: "flex items-start gap-2" },
                            React.createElement(badge_1.Badge, { className: "mt-0.5" }, "TIP"),
                            React.createElement("p", { className: "text-sm" }, "OnlyFans has your highest revenue per view. Focus on premium content there.")),
                        React.createElement("div", { className: "flex items-start gap-2" },
                            React.createElement(badge_1.Badge, { className: "mt-0.5" }, "TIP"),
                            React.createElement("p", { className: "text-sm" }, "Twitter engagement is declining. Try using more trending hashtags."))))),
            React.createElement(tabs_1.TabsContent, { value: "content", className: "space-y-4" },
                React.createElement(card_1.Card, null,
                    React.createElement(card_1.CardHeader, null,
                        React.createElement(card_1.CardTitle, null, "Top Performing Content"),
                        React.createElement(card_1.CardDescription, null, "Your best content ranked by performance")),
                    React.createElement(card_1.CardContent, null,
                        React.createElement("div", { className: "space-y-4" }, topContent.length === 0 ? (React.createElement("p", { className: "text-center text-muted-foreground py-8" }, "No content analytics available yet")) : (topContent.map((content, index) => (React.createElement("div", { key: content.id, className: "flex items-center justify-between p-3 rounded-lg border", "data-testid": `top-content-${index}` },
                            React.createElement("div", { className: "flex items-center gap-3" },
                                React.createElement("div", { className: "text-2xl font-bold text-muted-foreground" },
                                    "#",
                                    index + 1),
                                React.createElement("div", null,
                                    React.createElement("p", { className: "font-medium" }, content.title),
                                    React.createElement("div", { className: "flex gap-3 mt-1 text-xs text-muted-foreground" },
                                        React.createElement("span", null, content.type),
                                        React.createElement("span", null, "\u2022"),
                                        React.createElement("span", null, new Date(content.createdAt).toLocaleDateString())))),
                            React.createElement("div", { className: "flex gap-4 text-sm" },
                                React.createElement("div", { className: "text-center" },
                                    React.createElement("p", { className: "font-medium" }, content.analytics.views),
                                    React.createElement("p", { className: "text-xs text-muted-foreground" }, "views")),
                                React.createElement("div", { className: "text-center" },
                                    React.createElement("p", { className: "font-medium" }, content.analytics.likes),
                                    React.createElement("p", { className: "text-xs text-muted-foreground" }, "likes")),
                                React.createElement("div", { className: "text-center" },
                                    React.createElement("p", { className: "font-medium" },
                                        "$",
                                        (content.analytics.revenue / 100).toFixed(2)),
                                    React.createElement("p", { className: "text-xs text-muted-foreground" }, "earned")))))))))),
                React.createElement(card_1.Card, null,
                    React.createElement(card_1.CardHeader, null,
                        React.createElement(card_1.CardTitle, null, "Content Insights"),
                        React.createElement(card_1.CardDescription, null, "What's working for your audience")),
                    React.createElement(card_1.CardContent, { className: "space-y-3" },
                        React.createElement("div", { className: "space-y-2" },
                            React.createElement("div", { className: "flex justify-between text-sm" },
                                React.createElement("span", null, "Best posting time"),
                                React.createElement("span", { className: "font-medium" }, "8:00 PM - 10:00 PM")),
                            React.createElement("div", { className: "flex justify-between text-sm" },
                                React.createElement("span", null, "Most engaging content type"),
                                React.createElement("span", { className: "font-medium" }, "Video")),
                            React.createElement("div", { className: "flex justify-between text-sm" },
                                React.createElement("span", null, "Average view duration"),
                                React.createElement("span", { className: "font-medium" }, "2m 34s")),
                            React.createElement("div", { className: "flex justify-between text-sm" },
                                React.createElement("span", null, "Top performing hashtags"),
                                React.createElement("span", { className: "font-medium" }, "#exclusive #premium #fyp")))))))));
}
