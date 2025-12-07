import { useEffect, useRef, useState, useCallback } from "react";
import { logger } from "@/lib/logger";

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: number;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutId = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setConnectionStatus("connecting");
      
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setIsConnected(true);
        setConnectionStatus("connected");
        reconnectAttempts.current = 0;
        onConnect?.();
        console.log("WebSocket connected to DaddyFanz server");
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        setConnectionStatus("disconnected");
        onDisconnect?.();
        
        // Attempt reconnection if not explicitly closed
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`WebSocket disconnected. Reconnecting... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutId.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          console.error("Max reconnection attempts reached");
          setConnectionStatus("error");
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionStatus("error");
        onError?.(error);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setConnectionStatus("error");
    }
  }, [onMessage, onConnect, onDisconnect, onError, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
      reconnectTimeoutId.current = null;
    }
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus("disconnected");
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    } else {
      console.warn("WebSocket is not connected. Message not sent:", message);
      return false;
    }
  }, []);

  const sendPing = useCallback(() => {
    return sendMessage({ type: "ping", timestamp: Date.now() });
  }, [sendMessage]);

  const subscribe = useCallback((room: string) => {
    return sendMessage({ type: "subscribe", data: { room } });
  }, [sendMessage]);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Ping server every 30 seconds to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      sendPing();
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [isConnected, sendPing]);

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    sendMessage,
    sendPing,
    subscribe,
    connect,
    disconnect,
  };
}

// Custom hook for handling real-time messages
export function useRealTimeMessages(userId?: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case "new_message":
        setMessages(prev => [...prev, message.data]);
        break;
      case "user_online":
        setOnlineUsers(prev => [...new Set([...prev, message.data.userId])]);
        break;
      case "user_offline":
        setOnlineUsers(prev => prev.filter(id => id !== message.data.userId));
        break;
      case "typing":
        // Handle typing indicators
        break;
    }
  }, []);

  const {
    isConnected,
    connectionStatus,
    sendMessage,
    subscribe,
  } = useWebSocket({
    onMessage: handleMessage,
    onConnect: () => {
      if (userId) {
        subscribe(`user:${userId}`);
      }
    },
  });

  const sendChatMessage = useCallback((recipientId: string, content: string) => {
    return sendMessage({
      type: "message",
      data: {
        recipientId,
        content,
        timestamp: Date.now(),
      },
    });
  }, [sendMessage]);

  const sendTypingIndicator = useCallback((recipientId: string, isTyping: boolean) => {
    return sendMessage({
      type: "typing",
      data: {
        recipientId,
        isTyping,
        timestamp: Date.now(),
      },
    });
  }, [sendMessage]);

  return {
    isConnected,
    connectionStatus,
    messages,
    onlineUsers,
    sendChatMessage,
    sendTypingIndicator,
  };
}
