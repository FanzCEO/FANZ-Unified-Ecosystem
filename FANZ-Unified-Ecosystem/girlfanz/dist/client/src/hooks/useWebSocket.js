"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWebSocket = useWebSocket;
const react_1 = require("react");
const useAuth_1 = require("./useAuth");
function useWebSocket() {
    const { user, isAuthenticated } = (0, useAuth_1.useAuth)();
    const wsRef = (0, react_1.useRef)(null);
    const [isConnected, setIsConnected] = (0, react_1.useState)(false);
    const [lastMessage, setLastMessage] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (!isAuthenticated || !user) {
            return;
        }
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onopen = () => {
            var _a;
            console.log('WebSocket connection opened');
            // Authenticate with the server
            ws.send(JSON.stringify({
                type: 'auth',
                userId: ((_a = user.claims) === null || _a === void 0 ? void 0 : _a.sub) || user.id || 'anonymous',
            }));
        };
        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('WebSocket message received:', message.type);
                if (message.type === 'auth_success') {
                    setIsConnected(true);
                    console.log('WebSocket authenticated successfully');
                }
                else {
                    setLastMessage(message);
                }
            }
            catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };
        ws.onclose = () => {
            setIsConnected(false);
        };
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setIsConnected(false);
        };
        // Ping every 30 seconds to keep connection alive
        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);
        return () => {
            clearInterval(pingInterval);
            ws.close();
        };
    }, [isAuthenticated, user]);
    const sendMessage = (message) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    };
    const sendChatMessage = (receiverId, content) => {
        sendMessage({
            type: 'chat_message',
            receiverId,
            content,
        });
    };
    return {
        isConnected,
        lastMessage,
        sendMessage,
        sendChatMessage,
    };
}
