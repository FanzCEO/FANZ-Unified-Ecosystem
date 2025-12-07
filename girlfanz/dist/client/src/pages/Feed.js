"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Feed;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const PostComposer_1 = require("@/components/feed/PostComposer");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const avatar_1 = require("@/components/ui/avatar");
const badge_1 = require("@/components/ui/badge");
const skeleton_1 = require("@/components/ui/skeleton");
const lucide_react_1 = require("lucide-react");
const useAuth_1 = require("@/hooks/useAuth");
const utils_1 = require("@/lib/utils");
async function fetchFeed({ pageParam }) {
    const url = pageParam
        ? `/api/feed?cursor=${pageParam}&limit=20`
        : '/api/feed?limit=20';
    const response = await fetch(url, {
        credentials: 'include',
    });
    if (!response.ok) {
        const error = await response.json();
        if (error.code === 'AGE_VERIFICATION_REQUIRED') {
            throw new Error('AGE_VERIFICATION_REQUIRED');
        }
        throw new Error(error.error || 'Failed to fetch feed');
    }
    return response.json();
}
function PostCard({ post }) {
    const isLocked = post.visibility === 'paid' && !post.isFreePreview;
    return (React.createElement(card_1.Card, { className: (0, utils_1.cn)("bg-gf-charcoal/50 border-gf-steel/20", post.isSponsored && "border-gf-cyber/40"), "data-testid": `card-post-${post.id}` },
        React.createElement(card_1.CardHeader, { className: "pb-3" },
            React.createElement("div", { className: "flex items-center justify-between" },
                React.createElement("div", { className: "flex items-center gap-3" },
                    React.createElement(avatar_1.Avatar, { className: "h-10 w-10 border-2 border-gf-cyber/50" },
                        React.createElement(avatar_1.AvatarFallback, { className: "bg-gradient-to-br from-gf-cyber to-gf-pink text-white" }, "CR")),
                    React.createElement("div", null,
                        React.createElement("p", { className: "text-sm font-semibold text-gf-snow", "data-testid": `text-creator-${post.id}` }, "Creator"),
                        React.createElement("p", { className: "text-xs text-gf-steel" }, new Date(post.createdAt).toLocaleDateString()))),
                React.createElement("div", { className: "flex gap-2" },
                    post.isSponsored && (React.createElement(badge_1.Badge, { className: "bg-gf-cyber/20 text-gf-cyber border-gf-cyber/40", "data-testid": "badge-sponsored" },
                        React.createElement(lucide_react_1.Sparkles, { className: "h-3 w-3 mr-1" }),
                        "Sponsored")),
                    post.visibility === 'paid' && (React.createElement(badge_1.Badge, { className: "bg-gf-pink/20 text-gf-pink border-gf-pink/40", "data-testid": "badge-paid" },
                        "\uD83D\uDCB0 $",
                        (post.priceInCents || 0) / 100)),
                    post.visibility === 'subscriber' && (React.createElement(badge_1.Badge, { className: "bg-purple-500/20 text-purple-300 border-purple-500/40", "data-testid": "badge-subscribers" }, "\u2B50 Subscribers"))))),
        React.createElement(card_1.CardContent, { className: "space-y-3" },
            React.createElement("div", { className: (0, utils_1.cn)("relative", isLocked && "blur-sm pointer-events-none") },
                React.createElement("p", { className: "text-gf-snow whitespace-pre-wrap", "data-testid": `text-content-${post.id}` }, post.content)),
            isLocked && (React.createElement("div", { className: "flex justify-center py-4" },
                React.createElement(button_1.Button, { className: "bg-gradient-to-r from-gf-cyber to-gf-pink hover:opacity-90 text-white", "data-testid": `button-unlock-${post.id}` },
                    React.createElement(lucide_react_1.Lock, { className: "h-4 w-4 mr-2" }),
                    "Unlock for $",
                    (post.priceInCents || 0) / 100))),
            React.createElement("div", { className: "flex items-center gap-4 pt-3 border-t border-gf-steel/20" },
                React.createElement(button_1.Button, { variant: "ghost", size: "sm", className: "text-gf-steel hover:text-gf-pink hover:bg-gf-pink/10", "data-testid": `button-like-${post.id}` },
                    React.createElement(lucide_react_1.Heart, { className: "h-4 w-4 mr-1" }),
                    React.createElement("span", { className: "text-xs" }, "Like")),
                React.createElement(button_1.Button, { variant: "ghost", size: "sm", className: "text-gf-steel hover:text-gf-cyber hover:bg-gf-cyber/10", "data-testid": `button-comment-${post.id}` },
                    React.createElement(lucide_react_1.MessageCircle, { className: "h-4 w-4 mr-1" }),
                    React.createElement("span", { className: "text-xs" }, "Comment")),
                React.createElement(button_1.Button, { variant: "ghost", size: "sm", className: "text-gf-steel hover:text-gf-snow hover:bg-gf-steel/10", "data-testid": `button-share-${post.id}` },
                    React.createElement(lucide_react_1.Share2, { className: "h-4 w-4 mr-1" }),
                    React.createElement("span", { className: "text-xs" }, "Share")),
                React.createElement("div", { className: "ml-auto flex items-center gap-1 text-gf-steel text-xs" },
                    React.createElement(lucide_react_1.Eye, { className: "h-3 w-3" }),
                    React.createElement("span", { "data-testid": `text-views-${post.id}` }, "0"))))));
}
function PostSkeleton() {
    return (React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20" },
        React.createElement(card_1.CardHeader, { className: "pb-3" },
            React.createElement("div", { className: "flex items-center gap-3" },
                React.createElement(skeleton_1.Skeleton, { className: "h-10 w-10 rounded-full" }),
                React.createElement("div", { className: "space-y-2" },
                    React.createElement(skeleton_1.Skeleton, { className: "h-4 w-24" }),
                    React.createElement(skeleton_1.Skeleton, { className: "h-3 w-16" })))),
        React.createElement(card_1.CardContent, { className: "space-y-3" },
            React.createElement(skeleton_1.Skeleton, { className: "h-20 w-full" }),
            React.createElement("div", { className: "flex gap-4" },
                React.createElement(skeleton_1.Skeleton, { className: "h-8 w-16" }),
                React.createElement(skeleton_1.Skeleton, { className: "h-8 w-16" }),
                React.createElement(skeleton_1.Skeleton, { className: "h-8 w-16" })))));
}
function Feed() {
    var _a;
    const { user } = (0, useAuth_1.useAuth)();
    const [showAgeVerification, setShowAgeVerification] = (0, react_1.useState)(false);
    const observerRef = (0, react_1.useRef)(null);
    const loadMoreRef = (0, react_1.useRef)(null);
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error, } = (0, react_query_1.useInfiniteQuery)({
        queryKey: ['/api/feed'],
        queryFn: fetchFeed,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: undefined,
    });
    // Infinite scroll with IntersectionObserver
    const handleObserver = (0, react_1.useCallback)((entries) => {
        const [target] = entries;
        if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
    (0, react_1.useEffect)(() => {
        const element = loadMoreRef.current;
        if (!element)
            return;
        observerRef.current = new IntersectionObserver(handleObserver, {
            threshold: 0.5,
        });
        observerRef.current.observe(element);
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [handleObserver]);
    // Check for age verification error
    (0, react_1.useEffect)(() => {
        if ((error === null || error === void 0 ? void 0 : error.message) === 'AGE_VERIFICATION_REQUIRED') {
            setShowAgeVerification(true);
        }
    }, [error]);
    const allPosts = (_a = data === null || data === void 0 ? void 0 : data.pages.flatMap((page) => page.posts)) !== null && _a !== void 0 ? _a : [];
    if (showAgeVerification) {
        return (React.createElement("div", { className: "min-h-screen bg-gf-ink text-gf-snow" },
            React.createElement("div", { className: "max-w-4xl mx-auto px-4 py-20" },
                React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20 text-center p-12" },
                    React.createElement("div", { className: "space-y-4" },
                        React.createElement("div", { className: "text-6xl" }, "\uD83D\uDD1E"),
                        React.createElement("h2", { className: "text-2xl font-bold text-gf-cyber" }, "Age Verification Required"),
                        React.createElement("p", { className: "text-gf-steel max-w-md mx-auto" }, "You must verify your age to access this content. Click below to complete age verification with VerifyMy."),
                        React.createElement(button_1.Button, { className: "bg-gradient-to-r from-gf-cyber to-gf-pink hover:opacity-90 text-white mt-4", onClick: () => window.location.href = '/verification', "data-testid": "button-verify-age" }, "Verify Age"))))));
    }
    return (React.createElement("div", { className: "min-h-screen bg-gf-ink text-gf-snow" },
        React.createElement("div", { className: "max-w-4xl mx-auto px-4 py-6 space-y-6" },
            user && React.createElement(PostComposer_1.PostComposer, null),
            React.createElement("div", { className: "flex items-center justify-between" },
                React.createElement("h1", { className: "text-2xl font-bold bg-gradient-to-r from-gf-cyber to-gf-pink bg-clip-text text-transparent", "data-testid": "text-feed-title" }, "Your Feed"),
                React.createElement(button_1.Button, { variant: "ghost", className: "text-gf-steel hover:text-gf-snow", "data-testid": "button-filter" }, "Latest")),
            isLoading ? (React.createElement("div", { className: "space-y-6" }, [1, 2, 3].map((i) => (React.createElement(PostSkeleton, { key: i }))))) : isError ? (React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20 p-8 text-center" },
                React.createElement("p", { className: "text-gf-steel" }, error.message || 'Failed to load feed'))) : allPosts.length === 0 ? (React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20 p-12 text-center" },
                React.createElement("div", { className: "space-y-4" },
                    React.createElement("div", { className: "text-6xl" }, "\uD83D\uDCED"),
                    React.createElement("h3", { className: "text-xl font-semibold text-gf-snow" }, "No posts yet"),
                    React.createElement("p", { className: "text-gf-steel" }, "Follow creators or subscribe to see posts in your feed")))) : (React.createElement("div", { className: "space-y-6" }, allPosts.map((post) => (React.createElement(PostCard, { key: post.id, post: post }))))),
            hasNextPage && (React.createElement("div", { ref: loadMoreRef, className: "flex justify-center py-8", "data-testid": "div-load-more-trigger" }, isFetchingNextPage ? (React.createElement(PostSkeleton, null)) : (React.createElement(button_1.Button, { variant: "ghost", className: "text-gf-steel", onClick: () => fetchNextPage(), "data-testid": "button-load-more" }, "Load more")))))));
}
