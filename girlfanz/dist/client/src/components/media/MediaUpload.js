"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaUpload = MediaUpload;
const react_1 = require("react");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const textarea_1 = require("@/components/ui/textarea");
const select_1 = require("@/components/ui/select");
const checkbox_1 = require("@/components/ui/checkbox");
const lucide_react_1 = require("lucide-react");
const ObjectUploader_1 = require("@/components/ObjectUploader");
const queryClient_1 = require("@/lib/queryClient");
const use_toast_1 = require("@/hooks/use-toast");
const react_query_1 = require("@tanstack/react-query");
function MediaUpload() {
    const { toast } = (0, use_toast_1.useToast)();
    const queryClient = (0, react_query_1.useQueryClient)();
    const [uploadData, setUploadData] = (0, react_1.useState)({
        title: "",
        description: "",
        postType: "public",
        price: 0,
        isPublic: true,
        addWatermark: false,
        scheduleForLater: false,
    });
    const createMediaMutation = (0, react_query_1.useMutation)({
        mutationFn: async (mediaData) => {
            const response = await (0, queryClient_1.apiRequest)("POST", "/api/media", mediaData);
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Your content has been uploaded and is now in review.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/media"] });
            // Reset form
            setUploadData({
                title: "",
                description: "",
                postType: "public",
                price: 0,
                isPublic: true,
                addWatermark: false,
                scheduleForLater: false,
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: "Failed to upload content. Please try again.",
                variant: "destructive",
            });
        },
    });
    const handleGetUploadParameters = async () => {
        const response = await (0, queryClient_1.apiRequest)("POST", "/api/objects/upload", {});
        const data = await response.json();
        return {
            method: "PUT",
            url: data.uploadURL,
        };
    };
    const handleUploadComplete = async (result) => {
        if (!result.successful || result.successful.length === 0) {
            toast({
                title: "Error",
                description: "No files were uploaded successfully.",
                variant: "destructive",
            });
            return;
        }
        const uploadedFile = result.successful[0];
        const mediaUrl = uploadedFile.uploadURL;
        try {
            // Set ACL policy for the uploaded file
            await (0, queryClient_1.apiRequest)("PUT", "/api/media/upload", {
                mediaUrl,
                isPublic: uploadData.isPublic,
            });
            // Create media record
            const mediaData = {
                title: uploadData.title,
                description: uploadData.description,
                filename: uploadedFile.name || "unknown",
                s3Key: mediaUrl,
                mimeType: uploadedFile.type || "application/octet-stream",
                fileSize: uploadedFile.size || 0,
                isPublic: uploadData.isPublic,
                price: uploadData.postType === "premium" ? Math.round(uploadData.price * 100) : null,
            };
            createMediaMutation.mutate(mediaData);
        }
        catch (error) {
            toast({
                title: "Error",
                description: "Failed to process uploaded file.",
                variant: "destructive",
            });
        }
    };
    return (React.createElement(card_1.Card, { className: "glass-overlay border-gf-smoke/20" },
        React.createElement(card_1.CardContent, { className: "p-8" },
            React.createElement("h2", { className: "font-display font-bold text-2xl text-gf-snow mb-6" }, "Create New Post"),
            React.createElement("form", { className: "space-y-6" },
                React.createElement("div", { className: "space-y-2" },
                    React.createElement(label_1.Label, { htmlFor: "title", className: "text-gf-smoke" }, "Title"),
                    React.createElement(input_1.Input, { id: "title", placeholder: "Give your content a catchy title...", value: uploadData.title, onChange: (e) => setUploadData(Object.assign(Object.assign({}, uploadData), { title: e.target.value })), className: "bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink", "data-testid": "input-content-title" })),
                React.createElement("div", { className: "space-y-2" },
                    React.createElement(label_1.Label, { htmlFor: "description", className: "text-gf-smoke" }, "Description"),
                    React.createElement(textarea_1.Textarea, { id: "description", placeholder: "What's on your mind? Share your thoughts with your fans...", value: uploadData.description, onChange: (e) => setUploadData(Object.assign(Object.assign({}, uploadData), { description: e.target.value })), className: "bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke resize-none h-32 focus:border-gf-pink", "data-testid": "textarea-content-description" })),
                React.createElement("div", { className: "border-2 border-dashed border-gf-smoke/30 rounded-lg p-8 text-center hover:border-gf-pink transition-colors" },
                    React.createElement(lucide_react_1.CloudUpload, { className: "mx-auto h-12 w-12 text-gf-smoke mb-4" }),
                    React.createElement("p", { className: "text-gf-smoke mb-2" }, "Drag & drop your media here, or click to browse"),
                    React.createElement("p", { className: "text-sm text-gf-smoke/70 mb-4" }, "Supports images, videos, and audio files up to 100MB"),
                    React.createElement(ObjectUploader_1.ObjectUploader, { maxNumberOfFiles: 5, maxFileSize: 100 * 1024 * 1024, onGetUploadParameters: handleGetUploadParameters, onComplete: handleUploadComplete, buttonClassName: "bg-gf-violet text-gf-snow hover:bg-gf-violet/80" }, "Choose Files")),
                React.createElement("div", { className: "grid md:grid-cols-2 gap-6" },
                    React.createElement("div", { className: "space-y-2" },
                        React.createElement(label_1.Label, { htmlFor: "postType", className: "text-gf-smoke" }, "Post Type"),
                        React.createElement(select_1.Select, { value: uploadData.postType, onValueChange: (value) => setUploadData(Object.assign(Object.assign({}, uploadData), { postType: value, isPublic: value === "public" })) },
                            React.createElement(select_1.SelectTrigger, { className: "bg-gf-graphite border-gf-smoke/20 text-gf-snow focus:border-gf-pink" },
                                React.createElement(select_1.SelectValue, null)),
                            React.createElement(select_1.SelectContent, { className: "bg-gf-graphite border-gf-smoke/20" },
                                React.createElement(select_1.SelectItem, { value: "public" }, "Public Post"),
                                React.createElement(select_1.SelectItem, { value: "fan-only" }, "Fan-Only Post"),
                                React.createElement(select_1.SelectItem, { value: "premium" }, "Premium Content"),
                                React.createElement(select_1.SelectItem, { value: "live" }, "Live Stream")))),
                    uploadData.postType === "premium" && (React.createElement("div", { className: "space-y-2" },
                        React.createElement(label_1.Label, { htmlFor: "price", className: "text-gf-smoke" }, "Price"),
                        React.createElement("div", { className: "relative" },
                            React.createElement("span", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gf-smoke" }, "$"),
                            React.createElement(input_1.Input, { id: "price", type: "number", placeholder: "0.00", step: "0.01", min: "0", value: uploadData.price, onChange: (e) => setUploadData(Object.assign(Object.assign({}, uploadData), { price: parseFloat(e.target.value) || 0 })), className: "bg-gf-graphite border-gf-smoke/20 pl-8 text-gf-snow placeholder-gf-smoke focus:border-gf-pink", "data-testid": "input-content-price" }))))),
                React.createElement("div", { className: "flex items-center justify-between" },
                    React.createElement("div", { className: "flex items-center space-x-6 text-sm text-gf-smoke" },
                        React.createElement("div", { className: "flex items-center space-x-2" },
                            React.createElement(checkbox_1.Checkbox, { id: "schedule", checked: uploadData.scheduleForLater, onCheckedChange: (checked) => setUploadData(Object.assign(Object.assign({}, uploadData), { scheduleForLater: !!checked })) }),
                            React.createElement(label_1.Label, { htmlFor: "schedule" }, "Schedule for later")),
                        React.createElement("div", { className: "flex items-center space-x-2" },
                            React.createElement(checkbox_1.Checkbox, { id: "watermark", checked: uploadData.addWatermark, onCheckedChange: (checked) => setUploadData(Object.assign(Object.assign({}, uploadData), { addWatermark: !!checked })) }),
                            React.createElement(label_1.Label, { htmlFor: "watermark" }, "Add watermark"))),
                    React.createElement(button_1.Button, { type: "submit", disabled: createMediaMutation.isPending || !uploadData.title.trim(), className: "bg-gf-gradient text-gf-snow hover:shadow-glow-pink", "data-testid": "button-publish-post" }, createMediaMutation.isPending ? "Publishing..." : "Publish Post"))))));
}
