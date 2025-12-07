"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Messages;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const button_1 = require("@/components/ui/button");
const Sidebar_1 = require("@/components/layout/Sidebar");
const useWebSocket_1 = require("@/hooks/useWebSocket");
const useAuth_1 = require("@/hooks/useAuth");
const queryClient_1 = require("@/lib/queryClient");
const use_toast_1 = require("@/hooks/use-toast");
const lucide_react_1 = require("lucide-react");
function Messages() {
    const { user } = (0, useAuth_1.useAuth)();
    const { toast } = (0, use_toast_1.useToast)();
    const queryClient = (0, react_query_1.useQueryClient)();
    const { lastMessage, sendChatMessage, isConnected } = (0, useWebSocket_1.useWebSocket)();
    const messagesEndRef = (0, react_1.useRef)(null);
    const [selectedConversation, setSelectedConversation] = (0, react_1.useState)(null);
    const [messageInput, setMessageInput] = (0, react_1.useState)("");
    const { data: conversations } = (0, react_query_1.useQuery)({
        queryKey: ["/api/conversations"],
    });
    const { data: messages } = (0, react_query_1.useQuery)({
        queryKey: ["/api/messages", selectedConversation],
        enabled: !!selectedConversation,
    });
    const sendMessageMutation = (0, react_query_1.useMutation)({
        mutationFn: async (messageData) => {
            const response = await (0, queryClient_1.apiRequest)("POST", "/api/messages", messageData);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversation] });
            queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
            setMessageInput("");
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to send message.",
                variant: "destructive",
            });
        },
    });
    // Handle real-time messages
    (0, react_1.useEffect)(() => {
        if ((lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.type) === "new_message") {
            queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
            queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        }
    }, [lastMessage, queryClient]);
    // Auto-scroll to bottom when new messages arrive
    (0, react_1.useEffect)(() => {
        var _a;
        (_a = messagesEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    const handleSendMessage = () => {
        if (!messageInput.trim() || !selectedConversation)
            return;
        // Send via WebSocket for real-time delivery
        if (isConnected) {
            sendChatMessage(selectedConversation, messageInput);
        }
        // Also send via API for persistence
        sendMessageMutation.mutate({
            receiverId: selectedConversation,
            content: messageInput,
        });
    };
    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    return (React.createElement("div", { className: "min-h-screen bg-gf-ink text-gf-snow" },
        React.createElement("section", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" },
            React.createElement("div", { className: "grid lg:grid-cols-4 gap-8" },
                React.createElement("div", { className: "lg:col-span-1" },
                    React.createElement(Sidebar_1.Sidebar, null)),
                React.createElement("div", { className: "lg:col-span-3" },
                    React.createElement(card_1.Card, { className: "glass-overlay border-gf-smoke/20 overflow-hidden" },
                        React.createElement("div", { className: "flex flex-col lg:grid lg:grid-cols-3 min-h-[400px] lg:h-96" },
                            React.createElement("div", { className: "border-b lg:border-b-0 lg:border-r border-gf-smoke/20 p-4 lg:p-6 max-h-[300px] lg:max-h-none overflow-y-auto" },
                                React.createElement("h3", { className: "font-display font-semibold text-base lg:text-lg mb-3 lg:mb-4 text-gf-snow" }, "Messages"),
                                React.createElement("div", { className: "space-y-2 lg:space-y-3" }, conversations === null || conversations === void 0 ? void 0 : conversations.map((conv) => (React.createElement("div", { key: conv.otherUserId, onClick: () => setSelectedConversation(conv.otherUserId), className: `flex items-center space-x-2 lg:space-x-3 p-2 lg:p-3 rounded-lg cursor-pointer transition-colors ${selectedConversation === conv.otherUserId
                                        ? "bg-gf-pink/10 border border-gf-pink/20"
                                        : "hover:bg-gf-pink/5"}`, "data-testid": `conversation-${conv.otherUserId}` },
                                    React.createElement("div", { className: "relative" },
                                        React.createElement("img", { src: "/api/placeholder/40/40", alt: "User avatar", className: "w-8 h-8 lg:w-10 lg:h-10 rounded-full" }),
                                        React.createElement("div", { className: "absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-gf-graphite" })),
                                    React.createElement("div", { className: "flex-1 min-w-0" },
                                        React.createElement("div", { className: "flex items-center justify-between" },
                                            React.createElement("p", { className: "font-medium text-gf-snow text-sm", "data-testid": `sender-name-${conv.otherUserId}` },
                                                "User ",
                                                conv.otherUserId.slice(-4)),
                                            React.createElement("span", { className: "text-xs text-gf-smoke" }, formatTime(conv.lastMessageTime))),
                                        React.createElement("p", { className: "text-xs text-gf-smoke truncate", "data-testid": `last-message-${conv.otherUserId}` }, conv.lastMessage)),
                                    !conv.isRead && (React.createElement("div", { className: "bg-gf-pink text-xs rounded-full w-5 h-5 flex items-center justify-center" }, "!"))))))),
                            React.createElement("div", { className: "lg:col-span-2 flex flex-col min-h-[400px]" }, selectedConversation ? (React.createElement(React.Fragment, null,
                                React.createElement("div", { className: "border-b border-gf-smoke/20 p-4 flex items-center justify-between" },
                                    React.createElement("div", { className: "flex items-center space-x-3" },
                                        React.createElement("img", { src: "/api/placeholder/32/32", alt: "User avatar", className: "w-8 h-8 rounded-full" }),
                                        React.createElement("div", null,
                                            React.createElement("p", { className: "font-medium text-gf-snow text-sm" },
                                                "User ",
                                                selectedConversation.slice(-4)),
                                            React.createElement("p", { className: "text-xs text-success flex items-center" },
                                                React.createElement("div", { className: "w-2 h-2 bg-success rounded-full mr-1" }),
                                                isConnected ? "Online" : "Offline"))),
                                    React.createElement("div", { className: "flex items-center space-x-2" },
                                        React.createElement(button_1.Button, { variant: "ghost", size: "icon", className: "text-gf-smoke hover:text-gf-cyan" },
                                            React.createElement(lucide_react_1.Video, { className: "h-4 w-4" })),
                                        React.createElement(button_1.Button, { variant: "ghost", size: "icon", className: "text-gf-smoke hover:text-gf-cyan" },
                                            React.createElement(lucide_react_1.Phone, { className: "h-4 w-4" })))),
                                React.createElement("div", { className: "flex-1 p-3 lg:p-4 space-y-3 lg:space-y-4 overflow-y-auto max-h-[300px] lg:max-h-none" }, messages === null || messages === void 0 ? void 0 :
                                    messages.map((message) => (React.createElement("div", { key: message.id, className: `flex ${message.senderId === (user === null || user === void 0 ? void 0 : user.id) ? "justify-end" : "justify-start"}` },
                                        React.createElement("div", { className: `rounded-lg p-2 lg:p-3 max-w-[200px] sm:max-w-xs ${message.senderId === (user === null || user === void 0 ? void 0 : user.id)
                                                ? "bg-gf-pink text-gf-snow"
                                                : "bg-gf-graphite text-gf-snow"}`, "data-testid": `message-${message.id}` },
                                            React.createElement("p", { className: "text-xs sm:text-sm break-words" }, message.content),
                                            React.createElement("p", { className: `text-xs mt-1 ${message.senderId === (user === null || user === void 0 ? void 0 : user.id)
                                                    ? "text-gf-snow/70"
                                                    : "text-gf-smoke"}` }, formatTime(message.createdAt)))))),
                                    React.createElement("div", { ref: messagesEndRef })),
                                React.createElement("div", { className: "border-t border-gf-smoke/20 p-3 lg:p-4" },
                                    React.createElement("div", { className: "flex items-center gap-2 lg:gap-3" },
                                        React.createElement(button_1.Button, { variant: "ghost", size: "icon", className: "text-gf-smoke hover:text-gf-cyan" },
                                            React.createElement(lucide_react_1.Paperclip, { className: "h-4 w-4" })),
                                        React.createElement(button_1.Button, { variant: "ghost", size: "icon", className: "text-gf-smoke hover:text-gf-cyan" },
                                            React.createElement(lucide_react_1.Image, { className: "h-4 w-4" })),
                                        React.createElement(input_1.Input, { value: messageInput, onChange: (e) => setMessageInput(e.target.value), onKeyPress: handleKeyPress, placeholder: "Type a message...", className: "flex-1 bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink", "data-testid": "input-message" }),
                                        React.createElement(button_1.Button, { onClick: handleSendMessage, disabled: !messageInput.trim() || sendMessageMutation.isPending, variant: "ghost", size: "icon", className: "text-gf-pink hover:text-gf-violet", "data-testid": "button-send-message" },
                                            React.createElement(lucide_react_1.Send, { className: "h-4 w-4" })))))) : (React.createElement("div", { className: "flex-1 flex items-center justify-center text-gf-smoke" }, "Select a conversation to start messaging"))))))))));
}
