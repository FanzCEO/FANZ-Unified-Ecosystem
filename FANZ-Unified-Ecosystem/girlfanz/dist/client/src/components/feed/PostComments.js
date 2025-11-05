"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostComments = PostComments;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const button_1 = require("@/components/ui/button");
const textarea_1 = require("@/components/ui/textarea");
const avatar_1 = require("@/components/ui/avatar");
const use_toast_1 = require("@/hooks/use-toast");
const lucide_react_1 = require("lucide-react");
const queryClient_1 = require("@/lib/queryClient");
const date_fns_1 = require("date-fns");
function PostComments({ postId }) {
    const { toast } = (0, use_toast_1.useToast)();
    const [commentText, setCommentText] = (0, react_1.useState)("");
    const [replyingTo, setReplyingTo] = (0, react_1.useState)(null);
    // Fetch comments
    const { data: comments = [], isLoading } = (0, react_query_1.useQuery)({
        queryKey: ['/api/posts', postId, 'comments'],
    });
    // Add comment mutation
    const addCommentMutation = (0, react_query_1.useMutation)({
        mutationFn: async (data) => {
            const response = await (0, queryClient_1.apiRequest)("POST", `/api/posts/${postId}/comments`, data);
            return response.json();
        },
        onSuccess: () => {
            setCommentText("");
            setReplyingTo(null);
            queryClient_1.queryClient.invalidateQueries({ queryKey: ['/api/posts', postId, 'comments'] });
            queryClient_1.queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
            toast({
                title: "Comment posted",
                description: "Your comment has been added",
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to post comment",
                variant: "destructive",
            });
        },
    });
    // Like comment mutation
    const likeCommentMutation = (0, react_query_1.useMutation)({
        mutationFn: async (commentId) => {
            const response = await (0, queryClient_1.apiRequest)("POST", `/api/comments/${commentId}/like`, {});
            return response.json();
        },
        onSuccess: () => {
            queryClient_1.queryClient.invalidateQueries({ queryKey: ['/api/posts', postId, 'comments'] });
        },
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!commentText.trim())
            return;
        addCommentMutation.mutate({
            content: commentText.trim(),
            parentId: replyingTo || undefined,
        });
    };
    const renderComment = (comment, isReply = false) => (React.createElement("div", { key: comment.id, className: `flex gap-3 ${isReply ? 'ml-12 mt-3' : 'mt-4'}`, "data-testid": `comment-${comment.id}` },
        React.createElement(avatar_1.Avatar, { className: "h-8 w-8 flex-shrink-0" },
            React.createElement(avatar_1.AvatarImage, { src: comment.author.avatarUrl }),
            React.createElement(avatar_1.AvatarFallback, { className: "bg-gf-cyber/20 text-gf-cyber" }, comment.author.displayName[0])),
        React.createElement("div", { className: "flex-1 min-w-0" },
            React.createElement("div", { className: "bg-gf-charcoal/30 rounded-lg p-3" },
                React.createElement("div", { className: "flex items-center justify-between mb-1" },
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement("span", { className: "font-semibold text-gf-snow text-sm" }, comment.author.displayName),
                        React.createElement("span", { className: "text-gf-steel text-xs" },
                            "@",
                            comment.author.username),
                        comment.isPinned && (React.createElement(lucide_react_1.Pin, { className: "h-3 w-3 text-gf-cyber" }))),
                    React.createElement(button_1.Button, { variant: "ghost", size: "icon", className: "h-6 w-6 text-gf-steel hover:text-gf-snow", "data-testid": `button-comment-options-${comment.id}` },
                        React.createElement(lucide_react_1.MoreVertical, { className: "h-4 w-4" }))),
                React.createElement("p", { className: "text-gf-snow text-sm whitespace-pre-wrap break-words" }, comment.content),
                comment.isEdited && (React.createElement("span", { className: "text-gf-steel text-xs italic" }, "(edited)"))),
            React.createElement("div", { className: "flex items-center gap-4 mt-2 text-xs" },
                React.createElement(button_1.Button, { variant: "ghost", size: "sm", className: `h-auto p-0 gap-1 ${comment.isLiked ? 'text-gf-pink' : 'text-gf-steel'} hover:text-gf-pink`, onClick: () => likeCommentMutation.mutate(comment.id), "data-testid": `button-like-comment-${comment.id}` },
                    React.createElement(lucide_react_1.Heart, { className: "h-4 w-4", fill: comment.isLiked ? "currentColor" : "none" }),
                    comment.likes > 0 && React.createElement("span", null, comment.likes)),
                React.createElement(button_1.Button, { variant: "ghost", size: "sm", className: "h-auto p-0 gap-1 text-gf-steel hover:text-gf-cyber", onClick: () => setReplyingTo(comment.id), "data-testid": `button-reply-comment-${comment.id}` },
                    React.createElement(lucide_react_1.MessageCircle, { className: "h-4 w-4" }),
                    "Reply"),
                React.createElement("span", { className: "text-gf-steel" }, (0, date_fns_1.formatDistanceToNow)(new Date(comment.createdAt), { addSuffix: true }))),
            comment.replies && comment.replies.length > 0 && (React.createElement("div", { className: "mt-2" }, comment.replies.map(reply => renderComment(reply, true)))),
            replyingTo === comment.id && (React.createElement("form", { onSubmit: handleSubmit, className: "mt-3" },
                React.createElement("div", { className: "flex gap-2" },
                    React.createElement(textarea_1.Textarea, { value: commentText, onChange: (e) => setCommentText(e.target.value), placeholder: `Reply to @${comment.author.username}...`, className: "min-h-[60px] bg-gf-ink border-gf-steel/20 text-gf-snow", "data-testid": "input-reply" }),
                    React.createElement("div", { className: "flex flex-col gap-2" },
                        React.createElement(button_1.Button, { type: "submit", size: "icon", disabled: !commentText.trim() || addCommentMutation.isPending, className: "bg-gradient-to-r from-gf-cyber to-gf-pink hover:opacity-90", "data-testid": "button-submit-reply" },
                            React.createElement(lucide_react_1.Send, { className: "h-4 w-4" })),
                        React.createElement(button_1.Button, { type: "button", size: "icon", variant: "outline", onClick: () => {
                                setReplyingTo(null);
                                setCommentText("");
                            }, className: "border-gf-steel/20", "data-testid": "button-cancel-reply" }, "\u00D7"))))))));
    if (isLoading) {
        return (React.createElement("div", { className: "space-y-4 p-4" }, [1, 2, 3].map(i => (React.createElement("div", { key: i, className: "flex gap-3 animate-pulse" },
            React.createElement("div", { className: "h-8 w-8 bg-gf-charcoal/50 rounded-full" }),
            React.createElement("div", { className: "flex-1 space-y-2" },
                React.createElement("div", { className: "h-4 bg-gf-charcoal/50 rounded w-1/4" }),
                React.createElement("div", { className: "h-12 bg-gf-charcoal/50 rounded" })))))));
    }
    return (React.createElement("div", { className: "p-4 border-t border-gf-steel/20" },
        React.createElement("form", { onSubmit: handleSubmit, className: "mb-4" },
            React.createElement("div", { className: "flex gap-3" },
                React.createElement(textarea_1.Textarea, { value: commentText, onChange: (e) => setCommentText(e.target.value), placeholder: "Add a comment...", className: "min-h-[80px] bg-gf-ink border-gf-steel/20 text-gf-snow resize-none", "data-testid": "input-comment" }),
                React.createElement(button_1.Button, { type: "submit", size: "icon", disabled: !commentText.trim() || addCommentMutation.isPending, className: "bg-gradient-to-r from-gf-cyber to-gf-pink hover:opacity-90 h-[80px] w-12", "data-testid": "button-submit-comment" },
                    React.createElement(lucide_react_1.Send, { className: "h-5 w-5" })))),
        React.createElement("div", { className: "space-y-2" },
            React.createElement("h3", { className: "text-sm font-semibold text-gf-snow" },
                "Comments (",
                comments.length,
                ")"),
            comments.length === 0 ? (React.createElement("p", { className: "text-gf-steel text-sm text-center py-8" }, "No comments yet. Be the first to comment!")) : (React.createElement("div", { className: "space-y-4" }, comments.map(comment => renderComment(comment)))))));
}
