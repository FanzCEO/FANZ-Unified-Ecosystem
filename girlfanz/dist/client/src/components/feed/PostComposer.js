"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostComposer = PostComposer;
const react_1 = require("react");
const react_hook_form_1 = require("react-hook-form");
const zod_1 = require("@hookform/resolvers/zod");
const react_query_1 = require("@tanstack/react-query");
const queryClient_1 = require("@/lib/queryClient");
const schema_1 = require("@shared/schema");
const form_1 = require("@/components/ui/form");
const input_1 = require("@/components/ui/input");
const textarea_1 = require("@/components/ui/textarea");
const button_1 = require("@/components/ui/button");
const select_1 = require("@/components/ui/select");
const switch_1 = require("@/components/ui/switch");
const card_1 = require("@/components/ui/card");
const use_toast_1 = require("@/hooks/use-toast");
const lucide_react_1 = require("lucide-react");
const react_dropzone_1 = require("react-dropzone");
const postFormSchema = schema_1.insertFeedPostSchema.omit({
    id: true,
    creatorId: true,
    createdAt: true,
    updatedAt: true,
});
function PostComposer() {
    const { toast } = (0, use_toast_1.useToast)();
    const [isExpanded, setIsExpanded] = (0, react_1.useState)(false);
    const [mediaFiles, setMediaFiles] = (0, react_1.useState)([]);
    const [isUploading, setIsUploading] = (0, react_1.useState)(false);
    const form = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(postFormSchema),
        defaultValues: {
            type: "text",
            content: "",
            visibility: "subscriber",
            priceInCents: 0,
            isFreePreview: false,
            requiresAgeVerification: true,
            contentRating: "explicit",
            isPinned: false,
            isPublished: true,
        },
    });
    const onDrop = (0, react_1.useCallback)((acceptedFiles) => {
        const newFiles = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substring(7),
            file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith('video/') ? 'video' : 'image'
        }));
        setMediaFiles(prev => [...prev, ...newFiles]);
        // Auto-set post type based on media
        if (newFiles.length > 0) {
            const hasVideo = newFiles.some(f => f.type === 'video');
            const hasImage = newFiles.some(f => f.type === 'image');
            if (hasVideo && hasImage) {
                form.setValue('type', 'mixed');
            }
            else if (hasVideo) {
                form.setValue('type', 'video');
            }
            else {
                form.setValue('type', 'image');
            }
        }
    }, [form]);
    const { getRootProps, getInputProps, isDragActive } = (0, react_dropzone_1.useDropzone)({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
            'video/*': ['.mp4', '.webm', '.mov']
        },
        maxSize: 100 * 1024 * 1024, // 100MB
        multiple: true
    });
    const removeMedia = (id) => {
        setMediaFiles(prev => {
            const filtered = prev.filter(f => f.id !== id);
            // Revoke object URL to free memory
            const removed = prev.find(f => f.id === id);
            if (removed)
                URL.revokeObjectURL(removed.preview);
            return filtered;
        });
    };
    const uploadMedia = async (file) => {
        // Get upload URL from backend
        const uploadResponse = await (0, queryClient_1.apiRequest)("POST", "/api/objects/upload", {});
        const { uploadURL } = await uploadResponse.json();
        // Upload file to object storage
        await fetch(uploadURL, {
            method: "PUT",
            body: file,
            headers: {
                'Content-Type': file.type,
            }
        });
        return uploadURL.split('?')[0]; // Return URL without query params
    };
    const createPostMutation = (0, react_query_1.useMutation)({
        mutationFn: async (data) => {
            setIsUploading(true);
            // Upload media files first
            const mediaUrls = [];
            for (const mediaFile of mediaFiles) {
                try {
                    const url = await uploadMedia(mediaFile.file);
                    mediaUrls.push(url);
                }
                catch (error) {
                    console.error('Failed to upload media:', error);
                    throw new Error(`Failed to upload ${mediaFile.file.name}`);
                }
            }
            // Create post
            const response = await (0, queryClient_1.apiRequest)("POST", "/api/posts", data);
            const { post } = await response.json();
            // Attach media to post
            for (let i = 0; i < mediaUrls.length; i++) {
                await (0, queryClient_1.apiRequest)("POST", `/api/posts/${post.id}/media`, {
                    mediaUrl: mediaUrls[i],
                    mediaType: mediaFiles[i].type,
                    sortOrder: i,
                });
            }
            return post;
        },
        onSuccess: () => {
            toast({
                title: "Post created",
                description: "Your post has been published successfully",
            });
            form.reset();
            setMediaFiles([]);
            setIsExpanded(false);
            setIsUploading(false);
            queryClient_1.queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
        },
        onError: (error) => {
            setIsUploading(false);
            toast({
                title: "Error",
                description: error.message || "Failed to create post",
                variant: "destructive",
            });
        },
    });
    const onSubmit = (data) => {
        if (isUploading)
            return;
        createPostMutation.mutate(data);
    };
    const visibility = form.watch("visibility");
    const isPaid = visibility === "paid";
    return (React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20", "data-testid": "card-post-composer" },
        React.createElement(card_1.CardContent, { className: "p-4" },
            React.createElement(form_1.Form, Object.assign({}, form),
                React.createElement("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4" },
                    React.createElement(form_1.FormField, { control: form.control, name: "content", render: ({ field }) => (React.createElement(form_1.FormItem, null,
                            React.createElement(form_1.FormControl, null,
                                React.createElement(textarea_1.Textarea, Object.assign({}, field, { placeholder: "Share something with your fans...", className: "bg-gf-ink/50 border-gf-steel/20 text-gf-snow min-h-[100px] resize-none focus:ring-gf-cyber focus:border-gf-cyber", onFocus: () => setIsExpanded(true), "data-testid": "input-post-content" }))),
                            React.createElement(form_1.FormMessage, null))) }),
                    isExpanded && (React.createElement("div", { className: "space-y-4 animate-in fade-in slide-in-from-top-2 duration-200" },
                        React.createElement(form_1.FormField, { control: form.control, name: "type", render: ({ field }) => (React.createElement(form_1.FormItem, null,
                                React.createElement(form_1.FormLabel, { className: "text-gf-snow" }, "Content Type"),
                                React.createElement(select_1.Select, { onValueChange: field.onChange, defaultValue: field.value },
                                    React.createElement(form_1.FormControl, null,
                                        React.createElement(select_1.SelectTrigger, { className: "bg-gf-ink/50 border-gf-steel/20 text-gf-snow", "data-testid": "select-post-type" },
                                            React.createElement(select_1.SelectValue, { placeholder: "Select type" }))),
                                    React.createElement(select_1.SelectContent, null,
                                        React.createElement(select_1.SelectItem, { value: "text" }, "\uD83D\uDCDD Text"),
                                        React.createElement(select_1.SelectItem, { value: "image" }, "\uD83D\uDDBC\uFE0F Image"),
                                        React.createElement(select_1.SelectItem, { value: "video" }, "\uD83C\uDFAC Video"),
                                        React.createElement(select_1.SelectItem, { value: "mixed" }, "\uD83D\uDCF8 Mixed Media"))),
                                React.createElement(form_1.FormMessage, null))) }),
                        React.createElement(form_1.FormField, { control: form.control, name: "visibility", render: ({ field }) => (React.createElement(form_1.FormItem, null,
                                React.createElement(form_1.FormLabel, { className: "text-gf-snow" }, "Visibility"),
                                React.createElement(select_1.Select, { onValueChange: field.onChange, defaultValue: field.value },
                                    React.createElement(form_1.FormControl, null,
                                        React.createElement(select_1.SelectTrigger, { className: "bg-gf-ink/50 border-gf-steel/20 text-gf-snow", "data-testid": "select-visibility" },
                                            React.createElement(select_1.SelectValue, { placeholder: "Who can see this?" }))),
                                    React.createElement(select_1.SelectContent, null,
                                        React.createElement(select_1.SelectItem, { value: "free" }, "\uD83C\uDF0D Everyone (Free)"),
                                        React.createElement(select_1.SelectItem, { value: "subscriber" }, "\u2B50 Subscribers Only"),
                                        React.createElement(select_1.SelectItem, { value: "paid" }, "\uD83D\uDCB0 Paid Unlock"),
                                        React.createElement(select_1.SelectItem, { value: "followers" }, "\uD83D\uDC65 Followers Only"))),
                                React.createElement(form_1.FormMessage, null))) }),
                        isPaid && (React.createElement(form_1.FormField, { control: form.control, name: "priceInCents", render: ({ field }) => (React.createElement(form_1.FormItem, null,
                                React.createElement(form_1.FormLabel, { className: "text-gf-snow" }, "Unlock Price (cents)"),
                                React.createElement(form_1.FormControl, null,
                                    React.createElement("div", { className: "relative" },
                                        React.createElement(lucide_react_1.DollarSign, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gf-steel" }),
                                        React.createElement(input_1.Input, Object.assign({ type: "number" }, field, { onChange: (e) => field.onChange(parseInt(e.target.value) || 0), className: "pl-10 bg-gf-ink/50 border-gf-steel/20 text-gf-snow focus:ring-gf-cyber focus:border-gf-cyber", placeholder: "100", "data-testid": "input-price" })))),
                                React.createElement("p", { className: "text-xs text-gf-steel" },
                                    "$",
                                    ((field.value || 0) / 100).toFixed(2),
                                    " USD"),
                                React.createElement(form_1.FormMessage, null))) })),
                        React.createElement(form_1.FormField, { control: form.control, name: "isFreePreview", render: ({ field }) => (React.createElement(form_1.FormItem, { className: "flex items-center justify-between rounded-lg border border-gf-steel/20 p-3 bg-gf-ink/30" },
                                React.createElement("div", { className: "space-y-0.5" },
                                    React.createElement(form_1.FormLabel, { className: "text-sm text-gf-snow" }, "Free Preview"),
                                    React.createElement("p", { className: "text-xs text-gf-steel" }, "Allow non-subscribers to preview this post")),
                                React.createElement(form_1.FormControl, null,
                                    React.createElement(switch_1.Switch, { checked: field.value, onCheckedChange: field.onChange, className: "data-[state=checked]:bg-gf-cyber", "data-testid": "switch-free-preview" })))) }),
                        React.createElement(form_1.FormField, { control: form.control, name: "contentRating", render: ({ field }) => (React.createElement(form_1.FormItem, null,
                                React.createElement(form_1.FormLabel, { className: "text-gf-snow" }, "Content Rating"),
                                React.createElement(select_1.Select, { onValueChange: field.onChange, defaultValue: field.value },
                                    React.createElement(form_1.FormControl, null,
                                        React.createElement(select_1.SelectTrigger, { className: "bg-gf-ink/50 border-gf-steel/20 text-gf-snow", "data-testid": "select-content-rating" },
                                            React.createElement(select_1.SelectValue, { placeholder: "Select rating" }))),
                                    React.createElement(select_1.SelectContent, null,
                                        React.createElement(select_1.SelectItem, { value: "safe" }, "Safe"),
                                        React.createElement(select_1.SelectItem, { value: "suggestive" }, "Suggestive"),
                                        React.createElement(select_1.SelectItem, { value: "explicit" }, "Explicit (18+)"))),
                                React.createElement(form_1.FormMessage, null))) }),
                        mediaFiles.length > 0 && (React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3" }, mediaFiles.map((media) => (React.createElement("div", { key: media.id, className: "relative group rounded-lg overflow-hidden bg-gf-ink border border-gf-steel/20" },
                            media.type === 'image' ? (React.createElement("img", { src: media.preview, alt: "Preview", className: "w-full h-32 object-cover" })) : (React.createElement("video", { src: media.preview, className: "w-full h-32 object-cover" })),
                            React.createElement("button", { type: "button", onClick: () => removeMedia(media.id), className: "absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" },
                                React.createElement(lucide_react_1.X, { className: "h-4 w-4" })),
                            React.createElement("div", { className: "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2" },
                                React.createElement("p", { className: "text-xs text-white truncate" }, media.file.name))))))),
                        React.createElement("div", Object.assign({}, getRootProps(), { className: `border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${isDragActive
                                ? 'border-gf-cyber bg-gf-cyber/5'
                                : 'border-gf-steel/20 hover:border-gf-cyber/50'}`, "data-testid": "div-media-dropzone" }),
                            React.createElement("input", Object.assign({}, getInputProps())),
                            React.createElement(lucide_react_1.ImagePlus, { className: "h-8 w-8 text-gf-steel mx-auto mb-2" }),
                            React.createElement("p", { className: "text-sm text-gf-steel" }, isDragActive
                                ? 'Drop files here...'
                                : 'Drag & drop media, or click to browse'),
                            React.createElement("p", { className: "text-xs text-gf-steel/70 mt-1" }, "Images & videos up to 100MB")),
                        React.createElement("div", { className: "flex items-center justify-between pt-2" },
                            React.createElement("div", { className: "flex gap-2" },
                                React.createElement(button_1.Button, { type: "button", variant: "ghost", size: "icon", onClick: () => { var _a; return (_a = document.querySelector('input[type="file"]')) === null || _a === void 0 ? void 0 : _a.click(); }, className: "text-gf-steel hover:text-gf-cyber hover:bg-gf-cyber/10", "data-testid": "button-add-image" },
                                    React.createElement(lucide_react_1.ImagePlus, { className: "h-5 w-5" })),
                                React.createElement(button_1.Button, { type: "button", variant: "ghost", size: "icon", onClick: () => { var _a; return (_a = document.querySelector('input[type="file"]')) === null || _a === void 0 ? void 0 : _a.click(); }, className: "text-gf-steel hover:text-gf-cyber hover:bg-gf-cyber/10", "data-testid": "button-add-video" },
                                    React.createElement(lucide_react_1.Video, { className: "h-5 w-5" }))),
                            React.createElement("div", { className: "flex gap-2" },
                                React.createElement(button_1.Button, { type: "button", variant: "ghost", onClick: () => {
                                        form.reset();
                                        setIsExpanded(false);
                                    }, className: "text-gf-steel hover:text-gf-snow", "data-testid": "button-cancel" }, "Cancel"),
                                React.createElement(button_1.Button, { type: "submit", disabled: createPostMutation.isPending, className: "bg-gradient-to-r from-gf-cyber to-gf-pink hover:opacity-90 text-white", "data-testid": "button-publish" }, createPostMutation.isPending ? (React.createElement(React.Fragment, null, "Publishing...")) : (React.createElement(React.Fragment, null,
                                    React.createElement(lucide_react_1.Send, { className: "h-4 w-4 mr-2" }),
                                    "Publish"))))))))))));
}
