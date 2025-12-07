"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ContentUpload;
const react_1 = require("react");
const react_dropzone_1 = require("react-dropzone");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const textarea_1 = require("@/components/ui/textarea");
const progress_1 = require("@/components/ui/progress");
const use_toast_1 = require("@/hooks/use-toast");
const queryClient_1 = require("@/lib/queryClient");
const lucide_react_1 = require("lucide-react");
function ContentUpload({ onUpload }) {
    const [files, setFiles] = (0, react_1.useState)([]);
    const [uploading, setUploading] = (0, react_1.useState)(false);
    const [uploadProgress, setUploadProgress] = (0, react_1.useState)(0);
    const [title, setTitle] = (0, react_1.useState)('');
    const [description, setDescription] = (0, react_1.useState)('');
    const { toast } = (0, use_toast_1.useToast)();
    const onDrop = (0, react_1.useCallback)((acceptedFiles) => {
        setFiles(acceptedFiles);
    }, []);
    const { getRootProps, getInputProps, isDragActive } = (0, react_dropzone_1.useDropzone)({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
            'video/*': ['.mp4', '.mov', '.avi', '.wmv', '.webm'],
        },
        maxSize: 500 * 1024 * 1024, // 500MB
        multiple: false,
    });
    const getFileIcon = (file) => {
        if (file.type.startsWith('image/')) {
            return React.createElement(lucide_react_1.Image, { className: "h-8 w-8" });
        }
        else if (file.type.startsWith('video/')) {
            return React.createElement(lucide_react_1.Film, { className: "h-8 w-8" });
        }
        return React.createElement(lucide_react_1.File, { className: "h-8 w-8" });
    };
    const formatFileSize = (bytes) => {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };
    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };
    const handleUpload = async () => {
        if (files.length === 0) {
            toast({
                title: 'No file selected',
                description: 'Please select a file to upload.',
                variant: 'destructive',
            });
            return;
        }
        const file = files[0];
        setUploading(true);
        setUploadProgress(0);
        try {
            // Convert file to base64
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result;
                // Simulate upload progress
                const progressInterval = setInterval(() => {
                    setUploadProgress((prev) => {
                        if (prev >= 90) {
                            clearInterval(progressInterval);
                            return 90;
                        }
                        return prev + 10;
                    });
                }, 200);
                try {
                    const response = await (0, queryClient_1.apiRequest)('/api/creator/content/upload', {
                        method: 'POST',
                        body: {
                            title: title || `Upload ${new Date().toLocaleString()}`,
                            description,
                            type: file.type.startsWith('video/') ? 'video' : 'photo',
                            file: {
                                data: base64.split(',')[1], // Remove data:type/ext;base64, prefix
                                name: file.name,
                                type: file.type,
                            },
                        },
                    });
                    clearInterval(progressInterval);
                    setUploadProgress(100);
                    onUpload(response);
                    // Reset form
                    setFiles([]);
                    setTitle('');
                    setDescription('');
                    setUploadProgress(0);
                    toast({
                        title: 'Upload successful!',
                        description: 'Your content is being processed by AI.',
                    });
                }
                catch (error) {
                    clearInterval(progressInterval);
                    console.error('Upload failed:', error);
                    toast({
                        title: 'Upload failed',
                        description: 'Please try again with a smaller file.',
                        variant: 'destructive',
                    });
                }
            };
            reader.readAsDataURL(file);
        }
        catch (error) {
            console.error('Upload error:', error);
            toast({
                title: 'Upload error',
                description: 'Something went wrong. Please try again.',
                variant: 'destructive',
            });
        }
        finally {
            setUploading(false);
        }
    };
    return (React.createElement(card_1.Card, { className: "w-full" },
        React.createElement(card_1.CardContent, { className: "p-6 space-y-4" },
            React.createElement("div", Object.assign({}, getRootProps(), { className: `
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
            ${files.length > 0 ? 'bg-gray-50' : ''}
          `, "data-testid": "dropzone-area" }),
                React.createElement("input", Object.assign({}, getInputProps())),
                files.length === 0 ? (React.createElement(React.Fragment, null,
                    React.createElement(lucide_react_1.Upload, { className: "h-12 w-12 mx-auto mb-4 text-gray-400" }),
                    isDragActive ? (React.createElement("p", { className: "text-lg font-medium" }, "Drop the file here...")) : (React.createElement(React.Fragment, null,
                        React.createElement("p", { className: "text-lg font-medium mb-2" }, "Drag & drop your content here"),
                        React.createElement("p", { className: "text-sm text-muted-foreground" }, "or click to browse files"),
                        React.createElement("p", { className: "text-xs text-muted-foreground mt-2" }, "Supports: Images (JPEG, PNG, GIF) and Videos (MP4, MOV) up to 500MB"))))) : (React.createElement("div", { className: "space-y-2" }, files.map((file, index) => (React.createElement("div", { key: index, className: "flex items-center justify-between p-3 bg-white rounded-lg border", "data-testid": `file-item-${index}` },
                    React.createElement("div", { className: "flex items-center gap-3" },
                        getFileIcon(file),
                        React.createElement("div", { className: "text-left" },
                            React.createElement("p", { className: "font-medium text-sm" }, file.name),
                            React.createElement("p", { className: "text-xs text-muted-foreground" }, formatFileSize(file.size)))),
                    React.createElement(button_1.Button, { size: "sm", variant: "ghost", onClick: (e) => {
                            e.stopPropagation();
                            removeFile(index);
                        }, "data-testid": `button-remove-file-${index}` },
                        React.createElement(lucide_react_1.X, { className: "h-4 w-4" })))))))),
            files.length > 0 && (React.createElement(React.Fragment, null,
                React.createElement("div", { className: "space-y-2" },
                    React.createElement(label_1.Label, { htmlFor: "title" }, "Title (optional)"),
                    React.createElement(input_1.Input, { id: "title", placeholder: "Give your content a title...", value: title, onChange: (e) => setTitle(e.target.value), disabled: uploading, "data-testid": "input-title" })),
                React.createElement("div", { className: "space-y-2" },
                    React.createElement(label_1.Label, { htmlFor: "description" }, "Description (optional)"),
                    React.createElement(textarea_1.Textarea, { id: "description", placeholder: "Add a description...", value: description, onChange: (e) => setDescription(e.target.value), disabled: uploading, rows: 3, "data-testid": "textarea-description" })),
                uploading && (React.createElement("div", { className: "space-y-2" },
                    React.createElement("div", { className: "flex items-center justify-between text-sm" },
                        React.createElement("span", null, "Uploading..."),
                        React.createElement("span", null,
                            uploadProgress,
                            "%")),
                    React.createElement(progress_1.Progress, { value: uploadProgress, "data-testid": "progress-upload" }))),
                React.createElement(button_1.Button, { onClick: handleUpload, disabled: uploading || files.length === 0, className: "w-full", size: "lg", "data-testid": "button-upload" }, uploading ? (React.createElement(React.Fragment, null,
                    React.createElement(lucide_react_1.Loader2, { className: "h-4 w-4 mr-2 animate-spin" }),
                    "Uploading...")) : (React.createElement(React.Fragment, null,
                    React.createElement(lucide_react_1.Upload, { className: "h-4 w-4 mr-2" }),
                    "Upload Content"))))),
            React.createElement("div", { className: "flex items-start gap-2 p-3 bg-blue-50 rounded-lg" },
                React.createElement(lucide_react_1.CheckCircle, { className: "h-5 w-5 text-blue-500 mt-0.5" }),
                React.createElement("div", { className: "text-sm" },
                    React.createElement("p", { className: "font-medium text-blue-900" }, "AI Processing Included"),
                    React.createElement("p", { className: "text-blue-700" }, "Your content will be automatically edited, optimized for multiple platforms, and prepared for distribution."))))));
}
