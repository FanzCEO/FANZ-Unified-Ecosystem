"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Discover;
const react_query_1 = require("@tanstack/react-query");
const card_1 = require("@/components/ui/card");
const badge_1 = require("@/components/ui/badge");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
function Discover() {
    // Fetch AI-powered recommendations
    const { data: recommendations, isLoading } = (0, react_query_1.useQuery)({
        queryKey: ['/api/discover'],
    });
    const categories = [
        { name: "For You", icon: lucide_react_1.Sparkles, color: "from-gf-cyber to-gf-pink" },
        { name: "Trending", icon: lucide_react_1.TrendingUp, color: "from-orange-500 to-red-500" },
        { name: "Favorites", icon: lucide_react_1.Heart, color: "from-pink-500 to-red-500" },
        { name: "Top Rated", icon: lucide_react_1.Star, color: "from-yellow-500 to-orange-500" },
        { name: "New Creators", icon: lucide_react_1.Zap, color: "from-green-500 to-blue-500" },
    ];
    if (isLoading) {
        return (React.createElement("div", { className: "min-h-screen bg-gf-ink text-gf-snow p-6" },
            React.createElement("div", { className: "max-w-7xl mx-auto space-y-6" },
                React.createElement("div", { className: "animate-pulse space-y-4" },
                    React.createElement("div", { className: "h-10 bg-gf-charcoal/50 rounded w-1/3" }),
                    React.createElement("div", { className: "flex gap-2" }, [1, 2, 3, 4, 5].map(i => (React.createElement("div", { key: i, className: "h-10 w-32 bg-gf-charcoal/50 rounded" })))),
                    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mt-6" }, [1, 2, 3, 4, 5, 6].map(i => (React.createElement("div", { key: i, className: "h-64 bg-gf-charcoal/50 rounded" }))))))));
    }
    return (React.createElement("div", { className: "min-h-screen bg-gf-ink text-gf-snow p-6" },
        React.createElement("div", { className: "max-w-7xl mx-auto space-y-6" },
            React.createElement("div", { className: "flex items-center justify-between" },
                React.createElement("div", null,
                    React.createElement("h1", { className: "text-3xl font-bold bg-gradient-to-r from-gf-cyber to-gf-pink bg-clip-text text-transparent flex items-center gap-2", "data-testid": "text-discover-title" },
                        React.createElement(lucide_react_1.Sparkles, { className: "h-8 w-8 text-gf-cyber" }),
                        "Discover"),
                    React.createElement("p", { className: "text-gf-steel mt-1" }, "AI-powered content recommendations just for you")),
                React.createElement(button_1.Button, { variant: "outline", className: "border-gf-steel/20", "data-testid": "button-filter" },
                    React.createElement(lucide_react_1.Filter, { className: "h-4 w-4 mr-2" }),
                    "Filters")),
            (recommendations === null || recommendations === void 0 ? void 0 : recommendations.personalizedScore) && (React.createElement(card_1.Card, { className: "bg-gradient-to-r from-gf-cyber/10 to-gf-pink/10 border-gf-cyber/20" },
                React.createElement(card_1.CardContent, { className: "p-6" },
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement("div", null,
                            React.createElement("h3", { className: "text-lg font-semibold text-gf-snow flex items-center gap-2" },
                                React.createElement(lucide_react_1.Sparkles, { className: "h-5 w-5 text-gf-cyber" }),
                                "Personalization Score"),
                            React.createElement("p", { className: "text-sm text-gf-steel mt-1" }, "Based on your viewing history and preferences")),
                        React.createElement("div", { className: "text-right" },
                            React.createElement("div", { className: "text-4xl font-bold bg-gradient-to-r from-gf-cyber to-gf-pink bg-clip-text text-transparent" },
                                recommendations.personalizedScore,
                                "%"),
                            React.createElement("p", { className: "text-xs text-gf-steel mt-1" }, "Accuracy")))))),
            React.createElement("div", { className: "flex gap-2 overflow-x-auto pb-2" }, categories.map((category) => (React.createElement(button_1.Button, { key: category.name, className: `bg-gradient-to-r ${category.color} hover:opacity-90 whitespace-nowrap`, "data-testid": `button-category-${category.name.toLowerCase().replace(' ', '-')}` },
                React.createElement(category.icon, { className: "h-4 w-4 mr-2" }),
                category.name)))),
            (recommendations === null || recommendations === void 0 ? void 0 : recommendations.categories) && recommendations.categories.length > 0 && (React.createElement("div", null,
                React.createElement("h3", { className: "text-lg font-semibold text-gf-snow mb-3" }, "Trending Categories"),
                React.createElement("div", { className: "flex flex-wrap gap-2" }, recommendations.categories.map((category) => (React.createElement(badge_1.Badge, { key: category, className: "bg-gf-charcoal/50 border-gf-cyber/30 text-gf-snow hover:bg-gf-cyber/20 cursor-pointer", "data-testid": `badge-category-${category}` }, category)))))),
            React.createElement("div", null,
                React.createElement("h3", { className: "text-lg font-semibold text-gf-snow mb-4 flex items-center gap-2" },
                    React.createElement(lucide_react_1.Sparkles, { className: "h-5 w-5 text-gf-cyber" }),
                    "Recommended For You"),
                !recommendations || recommendations.posts.length === 0 ? (React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20" },
                    React.createElement(card_1.CardContent, { className: "p-12 text-center" },
                        React.createElement(lucide_react_1.Sparkles, { className: "h-12 w-12 text-gf-steel mx-auto mb-4" }),
                        React.createElement("h3", { className: "text-gf-snow font-semibold mb-2" }, "Building your recommendations"),
                        React.createElement("p", { className: "text-gf-steel" }, "Start exploring content to get personalized recommendations")))) : (React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" }, recommendations.posts.map((post) => (React.createElement(card_1.Card, { key: post.id, className: "bg-gf-charcoal/50 border-gf-steel/20 overflow-hidden hover:border-gf-cyber/50 transition-colors cursor-pointer", "data-testid": `card-recommended-post-${post.id}` },
                    React.createElement("div", { className: "relative h-48 bg-gradient-to-br from-gf-cyber/20 to-gf-pink/20" }),
                    React.createElement(card_1.CardContent, { className: "p-4" },
                        React.createElement("p", { className: "text-gf-snow line-clamp-2 mb-2" }, post.content),
                        React.createElement("div", { className: "flex items-center justify-between text-xs text-gf-steel" },
                            React.createElement("span", null, "@creator"),
                            React.createElement(badge_1.Badge, { className: "bg-gf-cyber/20 text-gf-cyber" }, "98% match"))))))))),
            React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-cyber/20" },
                React.createElement(card_1.CardContent, { className: "p-6" },
                    React.createElement("h3", { className: "text-lg font-semibold text-gf-snow mb-4 flex items-center gap-2" },
                        React.createElement(lucide_react_1.Zap, { className: "h-5 w-5 text-gf-cyber" }),
                        "AI Insights"),
                    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 text-sm" },
                        React.createElement("div", { className: "p-4 bg-gf-ink rounded-lg" },
                            React.createElement("p", { className: "text-gf-steel mb-1" }, "Most viewed category"),
                            React.createElement("p", { className: "text-gf-snow font-semibold" }, "Photography")),
                        React.createElement("div", { className: "p-4 bg-gf-ink rounded-lg" },
                            React.createElement("p", { className: "text-gf-steel mb-1" }, "Average watch time"),
                            React.createElement("p", { className: "text-gf-snow font-semibold" }, "12 min")),
                        React.createElement("div", { className: "p-4 bg-gf-ink rounded-lg" },
                            React.createElement("p", { className: "text-gf-steel mb-1" }, "Engagement rate"),
                            React.createElement("p", { className: "text-gf-snow font-semibold" }, "85%"))))))));
}
