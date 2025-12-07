import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/Sidebar";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Send, Phone, Video, Paperclip, Image } from "lucide-react";

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lastMessage, sendChatMessage, isConnected } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");

  const { data: conversations } = useQuery({
    queryKey: ["/api/conversations"],
  });

  const { data: messages } = useQuery({
    queryKey: ["/api/messages", selectedConversation],
    enabled: !!selectedConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { receiverId: string; content: string }) => {
      const response = await apiRequest("POST", "/api/messages", messageData);
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
  useEffect(() => {
    if (lastMessage?.type === "new_message") {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    }
  }, [lastMessage, queryClient]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar />
          </div>

          {/* Messages Interface */}
          <div className="lg:col-span-3">
            <Card className="glass-overlay border-gf-smoke/20 overflow-hidden">
              <div className="flex flex-col lg:grid lg:grid-cols-3 min-h-[400px] lg:h-96">
                {/* Conversations List */}
                <div className="border-b lg:border-b-0 lg:border-r border-gf-smoke/20 p-4 lg:p-6 max-h-[300px] lg:max-h-none overflow-y-auto">
                  <h3 className="font-display font-semibold text-base lg:text-lg mb-3 lg:mb-4 text-gf-snow">Messages</h3>
                  <div className="space-y-2 lg:space-y-3">
                    {conversations?.map((conv: any) => (
                      <div
                        key={conv.otherUserId}
                        onClick={() => setSelectedConversation(conv.otherUserId)}
                        className={`flex items-center space-x-2 lg:space-x-3 p-2 lg:p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConversation === conv.otherUserId
                            ? "bg-gf-pink/10 border border-gf-pink/20"
                            : "hover:bg-gf-pink/5"
                        }`}
                        data-testid={`conversation-${conv.otherUserId}`}
                      >
                        <div className="relative">
                          <img
                            src="/api/placeholder/40/40"
                            alt="User avatar"
                            className="w-8 h-8 lg:w-10 lg:h-10 rounded-full"
                          />
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-gf-graphite" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gf-snow text-sm" data-testid={`sender-name-${conv.otherUserId}`}>
                              User {conv.otherUserId.slice(-4)}
                            </p>
                            <span className="text-xs text-gf-smoke">
                              {formatTime(conv.lastMessageTime)}
                            </span>
                          </div>
                          <p className="text-xs text-gf-smoke truncate" data-testid={`last-message-${conv.otherUserId}`}>
                            {conv.lastMessage}
                          </p>
                        </div>
                        {!conv.isRead && (
                          <div className="bg-gf-pink text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            !
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat Area */}
                <div className="lg:col-span-2 flex flex-col min-h-[400px]">
                  {selectedConversation ? (
                    <>
                      {/* Chat Header */}
                      <div className="border-b border-gf-smoke/20 p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src="/api/placeholder/32/32"
                            alt="User avatar"
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <p className="font-medium text-gf-snow text-sm">
                              User {selectedConversation.slice(-4)}
                            </p>
                            <p className="text-xs text-success flex items-center">
                              <div className="w-2 h-2 bg-success rounded-full mr-1" />
                              {isConnected ? "Online" : "Offline"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="icon" className="text-gf-smoke hover:text-gf-cyan">
                            <Video className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-gf-smoke hover:text-gf-cyan">
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 p-3 lg:p-4 space-y-3 lg:space-y-4 overflow-y-auto max-h-[300px] lg:max-h-none">
                        {messages?.map((message: any) => (
                          <div
                            key={message.id}
                            className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`rounded-lg p-2 lg:p-3 max-w-[200px] sm:max-w-xs ${
                                message.senderId === user?.id
                                  ? "bg-gf-pink text-gf-snow"
                                  : "bg-gf-graphite text-gf-snow"
                              }`}
                              data-testid={`message-${message.id}`}
                            >
                              <p className="text-xs sm:text-sm break-words">{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                message.senderId === user?.id
                                  ? "text-gf-snow/70"
                                  : "text-gf-smoke"
                              }`}>
                                {formatTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Message Input */}
                      <div className="border-t border-gf-smoke/20 p-3 lg:p-4">
                        <div className="flex items-center gap-2 lg:gap-3">
                          <Button variant="ghost" size="icon" className="text-gf-smoke hover:text-gf-cyan">
                            <Paperclip className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-gf-smoke hover:text-gf-cyan">
                            <Image className="h-4 w-4" />
                          </Button>
                          <Input
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a message..."
                            className="flex-1 bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink"
                            data-testid="input-message"
                          />
                          <Button
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim() || sendMessageMutation.isPending}
                            variant="ghost"
                            size="icon"
                            className="text-gf-pink hover:text-gf-violet"
                            data-testid="button-send-message"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gf-smoke">
                      Select a conversation to start messaging
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
