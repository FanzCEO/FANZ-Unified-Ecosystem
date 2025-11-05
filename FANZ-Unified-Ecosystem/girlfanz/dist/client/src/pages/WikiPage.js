"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = WikiPage;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const badge_1 = require("@/components/ui/badge");
const tabs_1 = require("@/components/ui/tabs");
const lucide_react_1 = require("lucide-react");
const useAuth_1 = require("@/hooks/useAuth");
const queryClient_1 = require("@/lib/queryClient");
const wouter_1 = require("wouter");
function WikiPage() {
    const { isAuthenticated } = (0, useAuth_1.useAuth)();
    const params = (0, wouter_1.useParams)();
    const isDetailView = !!params.slug;
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [activeTab, setActiveTab] = (0, react_1.useState)('browse');
    const [searchSuggestions, setSearchSuggestions] = (0, react_1.useState)([]);
    const [selectedCategory, setSelectedCategory] = (0, react_1.useState)(null);
    // Fetch individual article for detail view
    const { data: articleDetail, isLoading: articleLoading } = (0, react_query_1.useQuery)({
        queryKey: ['/api/wiki/articles/by-slug', params.slug],
        queryFn: () => fetch(`/api/wiki/articles/by-slug/${params.slug}`).then(res => res.json()),
        enabled: isDetailView,
    });
    // Fetch regular articles
    const { data: articlesData, isLoading: articlesLoading } = (0, react_query_1.useQuery)({
        queryKey: ['/api/wiki/articles', searchQuery, selectedCategory],
        queryFn: () => {
            const params = new URLSearchParams();
            if (selectedCategory)
                params.set('category', selectedCategory);
            if (searchQuery)
                params.set('search', searchQuery);
            const queryString = params.toString();
            const url = `/api/wiki/articles${queryString ? `?${queryString}` : ''}`;
            return fetch(url).then(res => res.json());
        },
        enabled: !isDetailView, // Only fetch when not in detail view
    });
    // Fetch semantic search results when search query is provided
    const { data: searchData, isLoading: searchLoading } = (0, react_query_1.useQuery)({
        queryKey: ['/api/wiki/search/semantic', searchQuery],
        queryFn: () => fetch(`/api/wiki/search/semantic?q=${encodeURIComponent(searchQuery)}`).then(res => res.json()),
        enabled: searchQuery.length >= 2,
    });
    // Fetch AI recommendations for authenticated users
    const { data: recommendationsData } = (0, react_query_1.useQuery)({
        queryKey: ['/api/wiki/recommendations'],
        enabled: isAuthenticated,
    });
    // Fetch popular articles
    const { data: popularData } = (0, react_query_1.useQuery)({
        queryKey: ['/api/wiki/popular'],
    });
    // Fetch trending articles
    const { data: trendingData } = (0, react_query_1.useQuery)({
        queryKey: ['/api/wiki/trending'],
    });
    // Record article view
    const recordViewMutation = (0, react_query_1.useMutation)({
        mutationFn: (articleId) => (0, queryClient_1.apiRequest)('POST', `/api/wiki/articles/${articleId}/view`, {}),
    });
    // Get search suggestions
    (0, react_1.useEffect)(() => {
        if (searchQuery.length >= 2) {
            const timeoutId = setTimeout(async () => {
                try {
                    const response = await fetch(`/api/wiki/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
                    const data = await response.json();
                    setSearchSuggestions(data.suggestions || []);
                }
                catch (error) {
                    console.error('Error fetching suggestions:', error);
                    setSearchSuggestions([]);
                }
            }, 300);
            return () => clearTimeout(timeoutId);
        }
        else {
            setSearchSuggestions([]);
        }
    }, [searchQuery]);
    // Handle article click and view tracking
    const handleArticleClick = (article) => {
        recordViewMutation.mutate(article.id);
        // For now, navigate to article detail at /wiki/article/slug
        window.location.href = `/wiki/article/${article.slug}`;
    };
    // Determine which articles to display
    const displayedArticles = searchQuery.length >= 2
        ? (searchData === null || searchData === void 0 ? void 0 : searchData.articles) || []
        : (articlesData === null || articlesData === void 0 ? void 0 : articlesData.articles) || [];
    const isLoading = articlesLoading || searchLoading;
    const filteredArticles = displayedArticles.filter(article => {
        const matchesCategory = selectedCategory === null ||
            article.tags.includes(selectedCategory);
        return matchesCategory;
    });
    const allTags = Array.from(new Set(displayedArticles.flatMap(article => article.tags || [])));
    const popularTags = ['beginner', 'earnings', 'setup', 'guidelines', 'verification', 'moderation'];
    // Article Detail View
    if (isDetailView) {
        if (articleLoading) {
            return (React.createElement("div", { className: "min-h-screen bg-black text-white" },
                React.createElement("div", { className: "relative container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" },
                    React.createElement("div", { className: "animate-pulse space-y-4" },
                        React.createElement("div", { className: "h-8 bg-gray-700 rounded w-1/3" }),
                        React.createElement("div", { className: "h-4 bg-gray-700 rounded w-3/4" }),
                        React.createElement("div", { className: "h-4 bg-gray-700 rounded w-1/2" })))));
        }
        if (!articleDetail) {
            return (React.createElement("div", { className: "min-h-screen bg-black text-white" },
                React.createElement("div", { className: "relative container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" },
                    React.createElement("div", { className: "text-center py-12" },
                        React.createElement(lucide_react_1.BookOpen, { className: "h-16 w-16 mx-auto text-gray-600 mb-4" }),
                        React.createElement("h3", { className: "text-xl font-semibold text-white mb-2" }, "Article not found"),
                        React.createElement("p", { className: "text-gray-400 mb-4" }, "The article you're looking for doesn't exist."),
                        React.createElement(wouter_1.Link, { href: "/wiki" },
                            React.createElement(button_1.Button, { className: "bg-blue-600 hover:bg-blue-700" },
                                React.createElement(lucide_react_1.ArrowLeft, { className: "h-4 w-4 mr-2" }),
                                "Back to Knowledge Base"))))));
        }
        return (React.createElement("div", { className: "min-h-screen bg-black text-white" },
            React.createElement("div", { className: "relative container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" },
                React.createElement("div", { className: "mb-6" },
                    React.createElement(wouter_1.Link, { href: "/wiki" },
                        React.createElement(button_1.Button, { variant: "ghost", className: "text-gray-300 hover:text-white" },
                            React.createElement(lucide_react_1.ArrowLeft, { className: "h-4 w-4 mr-2" }),
                            "Back to Knowledge Base"))),
                React.createElement("article", { className: "max-w-4xl mx-auto" },
                    React.createElement("header", { className: "mb-8" },
                        React.createElement("h1", { className: "text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4" }, articleDetail.title),
                        React.createElement("p", { className: "text-gray-400 text-base sm:text-lg mb-4" }, articleDetail.summary),
                        React.createElement("div", { className: "flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500" },
                            React.createElement("div", { className: "flex items-center" },
                                React.createElement(lucide_react_1.Clock, { className: "h-4 w-4 mr-1" }),
                                new Date(articleDetail.publishedAt).toLocaleDateString()),
                            articleDetail.views && (React.createElement("div", { className: "flex items-center" },
                                React.createElement(lucide_react_1.Eye, { className: "h-4 w-4 mr-1" }),
                                articleDetail.views,
                                " views"))),
                        React.createElement("div", { className: "flex flex-wrap gap-2 mt-4" }, articleDetail.tags.map((tag) => (React.createElement(badge_1.Badge, { key: tag, variant: "outline", className: "border-blue-600 text-blue-400" }, tag))))),
                    React.createElement("div", { className: "prose prose-sm sm:prose prose-invert max-w-none" },
                        React.createElement("div", { className: "text-gray-300 text-base sm:text-lg leading-relaxed whitespace-pre-wrap break-words" }, articleDetail.content))))));
    }
    // List View
    return (React.createElement("div", { className: "min-h-screen bg-black text-white" },
        React.createElement("div", { className: "fixed inset-0 opacity-20 bg-cover bg-center bg-no-repeat", style: {
                backgroundImage: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1000 1000\"><defs><radialGradient id=\"g\" cx=\"50%\" cy=\"50%\" r=\"50%\"><stop offset=\"0%\" stop-color=\"%23ff00ff\" stop-opacity=\"0.3\"/><stop offset=\"100%\" stop-color=\"%2300ffff\" stop-opacity=\"0.1\"/></radialGradient></defs><rect width=\"100%\" height=\"100%\" fill=\"url(%23g)\"/></svg>')"
            } }),
        React.createElement("div", { className: "relative container mx-auto px-4 py-8" },
            React.createElement("div", { className: "text-center mb-8" },
                React.createElement("div", { className: "flex items-center justify-center gap-3 mb-4" },
                    React.createElement(lucide_react_1.Brain, { className: "h-6 w-6 sm:h-8 sm:w-8 text-cyan-400" }),
                    React.createElement("h1", { className: "text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent" }, "AI Knowledge Base")),
                React.createElement("p", { className: "text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4" }, "Intelligent search, personalized recommendations, and AI-powered insights to master the GirlFanz platform")),
            React.createElement("div", { className: "max-w-2xl mx-auto mb-8" },
                React.createElement("div", { className: "relative" },
                    React.createElement("div", { className: "flex items-center gap-2 absolute left-3 top-3 z-10" }, searchQuery.length >= 2 ? (React.createElement(lucide_react_1.Brain, { className: "h-5 w-5 text-cyan-400" })) : (React.createElement(lucide_react_1.Search, { className: "h-5 w-5 text-gray-400" }))),
                    React.createElement(input_1.Input, { placeholder: "Ask me anything... (AI-powered semantic search)", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-10 sm:pl-12 h-11 sm:h-12 bg-gray-900/50 border-gray-800 text-white text-base sm:text-lg", "data-testid": "input-wiki-search" }),
                    searchSuggestions.length > 0 && (React.createElement("div", { className: "absolute top-14 left-0 right-0 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-20" }, searchSuggestions.map((suggestion, index) => (React.createElement("button", { key: index, onClick: () => setSearchQuery(suggestion), className: "w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 first:rounded-t-lg last:rounded-b-lg", "data-testid": `suggestion-${index}` }, suggestion))))),
                    searchQuery.length >= 2 && (React.createElement("div", { className: "absolute top-14 left-0 text-xs text-cyan-400 flex items-center gap-1" },
                        React.createElement(lucide_react_1.Zap, { className: "h-3 w-3" }),
                        "Semantic search active")))),
            React.createElement("div", { className: "mb-8" },
                React.createElement(tabs_1.Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full" },
                    React.createElement(tabs_1.TabsList, { className: "grid w-full grid-cols-4 bg-gray-900/50 border border-gray-800 mb-6" },
                        React.createElement(tabs_1.TabsTrigger, { value: "browse", className: "flex items-center gap-2 data-[state=active]:bg-cyan-600 data-[state=active]:text-white", "data-testid": "tab-browse" },
                            React.createElement(lucide_react_1.BookOpen, { className: "h-4 w-4" }),
                            "Browse"),
                        isAuthenticated && (React.createElement(tabs_1.TabsTrigger, { value: "recommendations", className: "flex items-center gap-2 data-[state=active]:bg-cyan-600 data-[state=active]:text-white", "data-testid": "tab-recommendations" },
                            React.createElement(lucide_react_1.Brain, { className: "h-4 w-4" }),
                            "For You")),
                        React.createElement(tabs_1.TabsTrigger, { value: "popular", className: "flex items-center gap-2 data-[state=active]:bg-cyan-600 data-[state=active]:text-white", "data-testid": "tab-popular" },
                            React.createElement(lucide_react_1.Users, { className: "h-4 w-4" }),
                            "Popular"),
                        React.createElement(tabs_1.TabsTrigger, { value: "trending", className: "flex items-center gap-2 data-[state=active]:bg-cyan-600 data-[state=active]:text-white", "data-testid": "tab-trending" },
                            React.createElement(lucide_react_1.TrendingUp, { className: "h-4 w-4" }),
                            "Trending")),
                    React.createElement(tabs_1.TabsContent, { value: "browse", className: "space-y-6" },
                        React.createElement("div", { className: "mb-6" },
                            React.createElement("h3", { className: "text-lg font-semibold text-white mb-4" }, "Filter by Topic"),
                            React.createElement("div", { className: "flex flex-wrap gap-2" },
                                React.createElement(button_1.Button, { variant: selectedCategory === null ? "default" : "outline", onClick: () => setSelectedCategory(null), className: selectedCategory === null ?
                                        "bg-blue-600 hover:bg-blue-700" :
                                        "border-gray-600 text-gray-300 hover:bg-gray-800", "data-testid": "filter-all-topics" }, "All Topics"),
                                popularTags.map((tag) => (React.createElement(button_1.Button, { key: tag, variant: selectedCategory === tag ? "default" : "outline", onClick: () => setSelectedCategory(selectedCategory === tag ? null : tag), className: selectedCategory === tag ?
                                        "bg-blue-600 hover:bg-blue-700" :
                                        "border-gray-600 text-gray-300 hover:bg-gray-800", "data-testid": `filter-${tag}` }, tag.charAt(0).toUpperCase() + tag.slice(1)))))),
                        isLoading ? (React.createElement("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6" }, [1, 2, 3, 4, 5, 6].map((i) => (React.createElement(card_1.Card, { key: i, className: "bg-gray-900/50 border-gray-800" },
                            React.createElement(card_1.CardHeader, null,
                                React.createElement("div", { className: "animate-pulse space-y-3" },
                                    React.createElement("div", { className: "h-4 bg-gray-700 rounded w-3/4" }),
                                    React.createElement("div", { className: "h-3 bg-gray-700 rounded w-full" }),
                                    React.createElement("div", { className: "h-3 bg-gray-700 rounded w-2/3" })))))))) : filteredArticles.length > 0 ? (React.createElement("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6" }, filteredArticles.map((article) => (React.createElement(card_1.Card, { key: article.id, className: "bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer group", onClick: () => handleArticleClick(article), "data-testid": `article-${article.slug}` },
                            React.createElement(card_1.CardHeader, { className: "pb-4" },
                                React.createElement("div", { className: "flex items-start justify-between mb-2" },
                                    React.createElement(lucide_react_1.BookOpen, { className: "h-6 w-6 text-blue-400" }),
                                    React.createElement("div", { className: "flex items-center space-x-2" }, article.rating && (React.createElement("div", { className: "flex items-center text-yellow-400" },
                                        React.createElement(lucide_react_1.Star, { className: "h-4 w-4 fill-current" }),
                                        React.createElement("span", { className: "text-sm ml-1" }, article.rating))))),
                                React.createElement(card_1.CardTitle, { className: "text-white group-hover:text-blue-400 transition-colors" }, article.title),
                                React.createElement(card_1.CardDescription, { className: "text-gray-400" }, article.summary)),
                            React.createElement(card_1.CardContent, null,
                                React.createElement("div", { className: "flex flex-wrap gap-1 mb-4" },
                                    article.tags.slice(0, 3).map((tag) => (React.createElement(badge_1.Badge, { key: tag, variant: "outline", className: "text-xs border-blue-600 text-blue-400" }, tag))),
                                    article.tags.length > 3 && (React.createElement(badge_1.Badge, { variant: "outline", className: "text-xs border-gray-600 text-gray-400" },
                                        "+",
                                        article.tags.length - 3,
                                        " more"))),
                                React.createElement("div", { className: "flex items-center justify-between text-sm text-gray-500" },
                                    React.createElement("div", { className: "flex items-center space-x-4" },
                                        React.createElement("div", { className: "flex items-center" },
                                            React.createElement(lucide_react_1.Clock, { className: "h-4 w-4 mr-1" }),
                                            new Date(article.publishedAt).toLocaleDateString()),
                                        article.views && (React.createElement("div", { className: "flex items-center" },
                                            React.createElement(lucide_react_1.Eye, { className: "h-4 w-4 mr-1" }),
                                            article.views))),
                                    React.createElement(lucide_react_1.ChevronRight, { className: "h-4 w-4 text-gray-400 group-hover:text-blue-400 transition-colors" })))))))) : (React.createElement(card_1.Card, { className: "bg-gray-900/50 border-gray-800" },
                            React.createElement(card_1.CardContent, { className: "text-center py-12" },
                                React.createElement(lucide_react_1.Search, { className: "h-12 w-12 text-gray-500 mx-auto mb-4" }),
                                React.createElement("h3", { className: "text-lg font-semibold text-white mb-2" }, "No articles found"),
                                React.createElement("p", { className: "text-gray-400 mb-4" }, searchQuery ?
                                    `No articles match "${searchQuery}". Try different keywords or browse by category.` :
                                    'No articles available at the moment.'),
                                React.createElement(button_1.Button, { onClick: () => {
                                        setSearchQuery('');
                                        setSelectedCategory(null);
                                    }, variant: "outline", className: "border-gray-600 text-gray-300 hover:bg-gray-800" }, "Clear Filters"))))),
                    isAuthenticated && (React.createElement(tabs_1.TabsContent, { value: "recommendations", className: "space-y-6" },
                        React.createElement("div", { className: "text-center mb-6" },
                            React.createElement("div", { className: "flex items-center justify-center gap-2 mb-2" },
                                React.createElement(lucide_react_1.Brain, { className: "h-6 w-6 text-cyan-400" }),
                                React.createElement("h3", { className: "text-xl font-semibold text-white" }, "Personalized for You")),
                            React.createElement("p", { className: "text-gray-400" }, "AI-curated articles based on your interests and activity")),
                        (recommendationsData === null || recommendationsData === void 0 ? void 0 : recommendationsData.articles) && recommendationsData.articles.length > 0 ? (React.createElement("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6" }, recommendationsData.articles.map((article) => (React.createElement(card_1.Card, { key: article.id, className: "bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-600/30 hover:bg-cyan-800/20 transition-colors cursor-pointer", onClick: () => handleArticleClick(article), "data-testid": `recommended-article-${article.id}` },
                            React.createElement(card_1.CardHeader, null,
                                React.createElement("div", { className: "flex items-center gap-2 mb-2" },
                                    React.createElement(lucide_react_1.Brain, { className: "h-5 w-5 text-cyan-400" }),
                                    React.createElement(badge_1.Badge, { variant: "outline", className: "text-xs border-cyan-600 text-cyan-400" }, "Recommended")),
                                React.createElement(card_1.CardTitle, { className: "text-white" }, article.title),
                                React.createElement(card_1.CardDescription, { className: "text-gray-400" }, article.summary))))))) : (React.createElement("div", { className: "text-center py-12" },
                            React.createElement(lucide_react_1.Brain, { className: "h-16 w-16 mx-auto text-gray-600 mb-4" }),
                            React.createElement("h3", { className: "text-xl font-semibold text-white mb-2" }, "Building Your Profile"),
                            React.createElement("p", { className: "text-gray-400" }, "Read a few articles to get personalized recommendations!"))))),
                    React.createElement(tabs_1.TabsContent, { value: "popular", className: "space-y-6" },
                        React.createElement("div", { className: "text-center mb-6" },
                            React.createElement("div", { className: "flex items-center justify-center gap-2 mb-2" },
                                React.createElement(lucide_react_1.Users, { className: "h-6 w-6 text-orange-400" }),
                                React.createElement("h3", { className: "text-xl font-semibold text-white" }, "Most Popular")),
                            React.createElement("p", { className: "text-gray-400" }, "Articles loved by the community")),
                        (popularData === null || popularData === void 0 ? void 0 : popularData.articles) && popularData.articles.length > 0 ? (React.createElement("div", { className: "space-y-4" }, popularData.articles.map((article, index) => (React.createElement(card_1.Card, { key: article.id, className: "bg-gradient-to-r from-orange-900/20 to-red-900/20 border-orange-600/30 hover:bg-orange-800/20 transition-colors cursor-pointer", onClick: () => handleArticleClick(article), "data-testid": `popular-article-${article.id}` },
                            React.createElement(card_1.CardContent, { className: "p-6" },
                                React.createElement("div", { className: "flex items-start gap-4" },
                                    React.createElement("div", { className: "text-2xl font-bold text-orange-400 min-w-[3rem]" },
                                        "#",
                                        index + 1),
                                    React.createElement("div", { className: "flex-1" },
                                        React.createElement("h4", { className: "text-lg font-semibold text-white mb-2" }, article.title),
                                        React.createElement("p", { className: "text-gray-400 mb-3" }, article.summary))))))))) : (React.createElement("div", { className: "text-center py-12" },
                            React.createElement(lucide_react_1.Users, { className: "h-16 w-16 mx-auto text-gray-600 mb-4" }),
                            React.createElement("h3", { className: "text-xl font-semibold text-white mb-2" }, "No popular articles yet"),
                            React.createElement("p", { className: "text-gray-400" }, "Check back later for community favorites!")))),
                    React.createElement(tabs_1.TabsContent, { value: "trending", className: "space-y-6" },
                        React.createElement("div", { className: "text-center mb-6" },
                            React.createElement("div", { className: "flex items-center justify-center gap-2 mb-2" },
                                React.createElement(lucide_react_1.TrendingUp, { className: "h-6 w-6 text-green-400" }),
                                React.createElement("h3", { className: "text-xl font-semibold text-white" }, "Trending Now")),
                            React.createElement("p", { className: "text-gray-400" }, "Hot topics and recent discussions")),
                        (trendingData === null || trendingData === void 0 ? void 0 : trendingData.articles) && trendingData.articles.length > 0 ? (React.createElement("div", { className: "grid md:grid-cols-2 gap-6" }, trendingData.articles.map((article) => (React.createElement(card_1.Card, { key: article.id, className: "bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-600/30 hover:bg-green-800/20 transition-colors cursor-pointer", onClick: () => handleArticleClick(article), "data-testid": `trending-article-${article.id}` },
                            React.createElement(card_1.CardHeader, null,
                                React.createElement("div", { className: "flex items-center gap-2 mb-2" },
                                    React.createElement(lucide_react_1.TrendingUp, { className: "h-5 w-5 text-green-400" }),
                                    React.createElement(badge_1.Badge, { variant: "outline", className: "text-xs border-green-600 text-green-400" }, "Trending")),
                                React.createElement(card_1.CardTitle, { className: "text-white" }, article.title),
                                React.createElement(card_1.CardDescription, { className: "text-gray-400" }, article.summary))))))) : (React.createElement("div", { className: "text-center py-12" },
                            React.createElement(lucide_react_1.TrendingUp, { className: "h-16 w-16 mx-auto text-gray-600 mb-4" }),
                            React.createElement("h3", { className: "text-xl font-semibold text-white mb-2" }, "No trending articles"),
                            React.createElement("p", { className: "text-gray-400" }, "Check back soon for hot topics!")))))))));
}
