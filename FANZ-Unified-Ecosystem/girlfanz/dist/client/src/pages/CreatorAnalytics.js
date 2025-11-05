"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CreatorAnalytics;
const react_query_1 = require("@tanstack/react-query");
const card_1 = require("@/components/ui/card");
const tabs_1 = require("@/components/ui/tabs");
const lucide_react_1 = require("lucide-react");
const recharts_1 = require("recharts");
const COLORS = ['#FF2E7E', '#00E5FF', '#6C2BD9', '#F59E0B'];
function CreatorAnalytics() {
    // Fetch analytics data
    const { data: analytics, isLoading } = (0, react_query_1.useQuery)({
        queryKey: ['/api/creator/analytics'],
        queryFn: async () => {
            const response = await fetch('/api/creator/analytics', {
                credentials: 'include',
            });
            if (!response.ok)
                throw new Error('Failed to fetch analytics');
            return response.json();
        },
    });
    const stats = [
        {
            title: "Total Earnings",
            value: "$12,450",
            change: "+23%",
            icon: lucide_react_1.DollarSign,
            color: "text-green-500"
        },
        {
            title: "Active Subscribers",
            value: "1,234",
            change: "+12%",
            icon: lucide_react_1.Users,
            color: "text-gf-cyber"
        },
        {
            title: "Total Views",
            value: "45.2K",
            change: "+8%",
            icon: lucide_react_1.Eye,
            color: "text-gf-pink"
        },
        {
            title: "Engagement Rate",
            value: "78%",
            change: "+5%",
            icon: lucide_react_1.TrendingUp,
            color: "text-blue-500"
        }
    ];
    const earningsData = [
        { month: 'Jan', earnings: 4200, tips: 800, unlocks: 600 },
        { month: 'Feb', earnings: 5100, tips: 900, unlocks: 700 },
        { month: 'Mar', earnings: 6800, tips: 1200, unlocks: 900 },
        { month: 'Apr', earnings: 8400, tips: 1500, unlocks: 1100 },
        { month: 'May', earnings: 10200, tips: 1800, unlocks: 1400 },
        { month: 'Jun', earnings: 12450, tips: 2100, unlocks: 1650 },
    ];
    const contentPerformance = [
        { type: 'Photos', count: 145, revenue: 5200 },
        { type: 'Videos', count: 67, revenue: 4800 },
        { type: 'Mixed', count: 89, revenue: 2450 },
    ];
    const revenueByType = [
        { name: 'Subscriptions', value: 58 },
        { name: 'Tips', value: 25 },
        { name: 'Unlocks', value: 17 },
    ];
    const topPosts = [
        {
            id: '1',
            title: 'Summer Vibes 🌞',
            views: 12500,
            likes: 2340,
            comments: 456,
            revenue: 890,
            type: 'image'
        },
        {
            id: '2',
            title: 'Behind the Scenes',
            views: 10200,
            likes: 1890,
            comments: 234,
            revenue: 750,
            type: 'video'
        },
        {
            id: '3',
            title: 'Exclusive Collection',
            views: 9800,
            likes: 1750,
            comments: 198,
            revenue: 1200,
            type: 'mixed'
        },
    ];
    if (isLoading) {
        return (React.createElement("div", { className: "min-h-screen bg-gf-ink text-gf-snow p-6" },
            React.createElement("div", { className: "max-w-7xl mx-auto" },
                React.createElement("div", { className: "animate-pulse space-y-4" },
                    React.createElement("div", { className: "h-8 bg-gf-charcoal/50 rounded w-1/4" }),
                    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4" }, [1, 2, 3, 4].map(i => (React.createElement("div", { key: i, className: "h-32 bg-gf-charcoal/50 rounded" }))))))));
    }
    return (React.createElement("div", { className: "min-h-screen bg-gf-ink text-gf-snow p-6" },
        React.createElement("div", { className: "max-w-7xl mx-auto space-y-6" },
            React.createElement("div", { className: "flex items-center justify-between" },
                React.createElement("div", null,
                    React.createElement("h1", { className: "text-3xl font-bold bg-gradient-to-r from-gf-cyber to-gf-pink bg-clip-text text-transparent", "data-testid": "text-analytics-title" }, "Creator Analytics"),
                    React.createElement("p", { className: "text-gf-steel mt-1" }, "Track your performance and earnings"))),
            React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" }, stats.map((stat, index) => (React.createElement(card_1.Card, { key: index, className: "bg-gf-charcoal/50 border-gf-steel/20", "data-testid": `card-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}` },
                React.createElement(card_1.CardContent, { className: "p-6" },
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement("div", null,
                            React.createElement("p", { className: "text-sm text-gf-steel" }, stat.title),
                            React.createElement("p", { className: "text-2xl font-bold text-gf-snow mt-2", "data-testid": `text-stat-value-${index}` }, stat.value),
                            React.createElement("p", { className: `text-sm mt-1 ${stat.color}` },
                                stat.change,
                                " from last month")),
                        React.createElement("div", { className: `p-3 rounded-lg bg-gf-ink ${stat.color}` },
                            React.createElement(stat.icon, { className: "h-6 w-6" })))))))),
            React.createElement(tabs_1.Tabs, { defaultValue: "earnings", className: "space-y-4" },
                React.createElement(tabs_1.TabsList, { className: "bg-gf-charcoal/50 border border-gf-steel/20" },
                    React.createElement(tabs_1.TabsTrigger, { value: "earnings", "data-testid": "tab-earnings" }, "Earnings"),
                    React.createElement(tabs_1.TabsTrigger, { value: "content", "data-testid": "tab-content" }, "Content Performance"),
                    React.createElement(tabs_1.TabsTrigger, { value: "audience", "data-testid": "tab-audience" }, "Audience"),
                    React.createElement(tabs_1.TabsTrigger, { value: "posts", "data-testid": "tab-posts" }, "Top Posts")),
                React.createElement(tabs_1.TabsContent, { value: "earnings", className: "space-y-4" },
                    React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4" },
                        React.createElement(card_1.Card, { className: "lg:col-span-2 bg-gf-charcoal/50 border-gf-steel/20" },
                            React.createElement(card_1.CardHeader, null,
                                React.createElement(card_1.CardTitle, { className: "text-gf-snow" }, "Earnings Overview")),
                            React.createElement(card_1.CardContent, null,
                                React.createElement(recharts_1.ResponsiveContainer, { width: "100%", height: 300 },
                                    React.createElement(recharts_1.LineChart, { data: earningsData },
                                        React.createElement(recharts_1.CartesianGrid, { strokeDasharray: "3 3", stroke: "#333" }),
                                        React.createElement(recharts_1.XAxis, { dataKey: "month", stroke: "#C7BBD3" }),
                                        React.createElement(recharts_1.YAxis, { stroke: "#C7BBD3" }),
                                        React.createElement(recharts_1.Tooltip, { contentStyle: { backgroundColor: '#121214', border: '1px solid #333' }, labelStyle: { color: '#F5F7FA' } }),
                                        React.createElement(recharts_1.Line, { type: "monotone", dataKey: "earnings", stroke: "#FF2E7E", strokeWidth: 2 }),
                                        React.createElement(recharts_1.Line, { type: "monotone", dataKey: "tips", stroke: "#00E5FF", strokeWidth: 2 }),
                                        React.createElement(recharts_1.Line, { type: "monotone", dataKey: "unlocks", stroke: "#6C2BD9", strokeWidth: 2 }))))),
                        React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20" },
                            React.createElement(card_1.CardHeader, null,
                                React.createElement(card_1.CardTitle, { className: "text-gf-snow" }, "Revenue Sources")),
                            React.createElement(card_1.CardContent, null,
                                React.createElement(recharts_1.ResponsiveContainer, { width: "100%", height: 300 },
                                    React.createElement(recharts_1.PieChart, null,
                                        React.createElement(recharts_1.Pie, { data: revenueByType, cx: "50%", cy: "50%", labelLine: false, label: ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`, outerRadius: 80, fill: "#8884d8", dataKey: "value" }, revenueByType.map((entry, index) => (React.createElement(recharts_1.Cell, { key: `cell-${index}`, fill: COLORS[index % COLORS.length] })))),
                                        React.createElement(recharts_1.Tooltip, null))))))),
                React.createElement(tabs_1.TabsContent, { value: "content" },
                    React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20" },
                        React.createElement(card_1.CardHeader, null,
                            React.createElement(card_1.CardTitle, { className: "text-gf-snow" }, "Content Type Performance")),
                        React.createElement(card_1.CardContent, null,
                            React.createElement(recharts_1.ResponsiveContainer, { width: "100%", height: 300 },
                                React.createElement(recharts_1.BarChart, { data: contentPerformance },
                                    React.createElement(recharts_1.CartesianGrid, { strokeDasharray: "3 3", stroke: "#333" }),
                                    React.createElement(recharts_1.XAxis, { dataKey: "type", stroke: "#C7BBD3" }),
                                    React.createElement(recharts_1.YAxis, { stroke: "#C7BBD3" }),
                                    React.createElement(recharts_1.Tooltip, { contentStyle: { backgroundColor: '#121214', border: '1px solid #333' }, labelStyle: { color: '#F5F7FA' } }),
                                    React.createElement(recharts_1.Bar, { dataKey: "count", fill: "#FF2E7E", name: "Posts" }),
                                    React.createElement(recharts_1.Bar, { dataKey: "revenue", fill: "#00E5FF", name: "Revenue ($)" })))))),
                React.createElement(tabs_1.TabsContent, { value: "posts" },
                    React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20" },
                        React.createElement(card_1.CardHeader, null,
                            React.createElement(card_1.CardTitle, { className: "text-gf-snow" }, "Top Performing Posts")),
                        React.createElement(card_1.CardContent, null,
                            React.createElement("div", { className: "space-y-4" }, topPosts.map((post) => (React.createElement("div", { key: post.id, className: "flex items-center justify-between p-4 bg-gf-ink rounded-lg border border-gf-steel/20", "data-testid": `card-top-post-${post.id}` },
                                React.createElement("div", { className: "flex-1" },
                                    React.createElement("h3", { className: "font-semibold text-gf-snow" }, post.title),
                                    React.createElement("div", { className: "flex items-center gap-4 mt-2 text-sm text-gf-steel" },
                                        React.createElement("span", { className: "flex items-center gap-1" },
                                            React.createElement(lucide_react_1.Eye, { className: "h-4 w-4" }),
                                            post.views.toLocaleString()),
                                        React.createElement("span", { className: "flex items-center gap-1" },
                                            React.createElement(lucide_react_1.Heart, { className: "h-4 w-4" }),
                                            post.likes.toLocaleString()),
                                        React.createElement("span", { className: "flex items-center gap-1" },
                                            React.createElement(lucide_react_1.MessageSquare, { className: "h-4 w-4" }),
                                            post.comments))),
                                React.createElement("div", { className: "text-right" },
                                    React.createElement("p", { className: "text-lg font-bold text-green-500" },
                                        "$",
                                        post.revenue),
                                    React.createElement("p", { className: "text-xs text-gf-steel mt-1" }, "Revenue"))))))))),
                React.createElement(tabs_1.TabsContent, { value: "audience" },
                    React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20" },
                        React.createElement(card_1.CardHeader, null,
                            React.createElement(card_1.CardTitle, { className: "text-gf-snow" }, "Audience Insights")),
                        React.createElement(card_1.CardContent, null,
                            React.createElement("p", { className: "text-gf-steel" }, "Coming soon: Demographics, engagement patterns, and subscriber retention metrics."))))))));
}
