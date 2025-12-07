import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRealTimeMessages } from "@/hooks/useWebSocket";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageCircle, Search, Phone, Video } from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  mediaUrl?: string;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  userId: string;
  displayName: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export default function Messages() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real-time messaging
  const {
    isConnected,
    connectionStatus,
    sendChatMessage,
    sendTypingIndicator,
  } = useRealTimeMessages(user?.id);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Mock conversations data for now
  const conversations: Conversation[] = [
    {
      userId: "user1",
      displayName: "AlphaDom",
      lastMessage: "Hey there, how's your day?",
      lastMessageTime: "2 hours ago",
      unreadCount: 2,
    },
    {
      userId: "user2", 
      displayName: "MasterChief",
      lastMessage: "Thanks for the great content!",
      lastMessageTime: "1 day ago",
      unreadCount: 0,
    },
    {
      userId: "user3",
      displayName: "PowerBottom",
      lastMessage: "When will you upload new videos?",
      lastMessageTime: "3 days ago", 
      unreadCount: 1,
    },
  ];

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/messages", selectedConversation],
    enabled: !!selectedConversation && isAuthenticated,
    retry: false,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { recipientId: string; content: string }) => {
      const response = await apiRequest("POST", "/api/messages", data);
      return response.json();
    },
    onSuccess: (newMessage) => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversation] });
      setMessageInput("");
      
      // Also send via WebSocket for real-time delivery
      if (selectedConversation) {
        sendChatMessage(selectedConversation, newMessage.content);
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Message Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      recipientId: selectedConversation,
      content: messageInput.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-df-dungeon flex items-center justify-center">
        <div className="text-df-cyan text-xl font-display">Loading messages...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-df-dungeon">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-df-snow mb-2">
                Messages
              </h1>
              <p className="text-df-fog">Connect with your fans and fellow creators</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 pulse-glow' : 'bg-red-500'}`}></div>
              <span className="text-df-fog text-sm">
                {connectionStatus === 'connected' ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-16rem)]">
          {/* Conversations List */}
          <Card className="card-df lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg neon-subheading">
                <MessageCircle className="inline mr-2 h-5 w-5" />
                Conversations
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-df-fog" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-df pl-10"
                  data-testid="input-search-conversations"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {filteredConversations.length > 0 ? (
                  <div className="space-y-2 p-4">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.userId}
                        onClick={() => setSelectedConversation(conversation.userId)}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          selectedConversation === conversation.userId
                            ? 'bg-df-cyan bg-opacity-20 border border-df-cyan'
                            : 'hover:bg-df-steel hover:bg-opacity-20'
                        }`}
                        data-testid={`conversation-${conversation.userId}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-df-steel">
                            <AvatarFallback className="bg-df-ink text-df-cyan">
                              {conversation.displayName[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-df-snow font-medium truncate">
                                {conversation.displayName}
                              </h4>
                              {conversation.unreadCount > 0 && (
                                <span className="bg-df-gold text-df-ink text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                  {conversation.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-df-fog text-sm truncate">
                              {conversation.lastMessage}
                            </p>
                            <p className="text-df-fog text-xs">
                              {conversation.lastMessageTime}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <MessageCircle className="h-12 w-12 text-df-fog mx-auto mb-4" />
                    <p className="text-df-fog">No conversations found</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="card-df lg:col-span-2">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b border-df-steel">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-df-steel">
                        <AvatarFallback className="bg-df-ink text-df-cyan">
                          {conversations.find(c => c.userId === selectedConversation)?.displayName[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-df-snow font-semibold">
                          {conversations.find(c => c.userId === selectedConversation)?.displayName}
                        </h3>
                        <p className="text-df-fog text-sm">
                          {isConnected ? 'Online' : 'Last seen recently'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button className="btn-outline p-2" data-testid="button-voice-call">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button className="btn-outline p-2" data-testid="button-video-call">
                        <Video className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="p-0 flex flex-col h-96">
                  <ScrollArea className="flex-1 p-4">
                    {messagesLoading ? (
                      <div className="text-center py-8">
                        <div className="text-df-fog">Loading messages...</div>
                      </div>
                    ) : messages && messages.length > 0 ? (
                      <div className="space-y-4">
                        {messages.map((message: Message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.senderId === user.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.senderId === user.id
                                  ? 'bg-df-cyan text-df-ink'
                                  : 'bg-df-steel text-df-snow'
                              }`}
                              data-testid={`message-${message.id}`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                message.senderId === user.id ? 'text-df-ink text-opacity-70' : 'text-df-fog'
                              }`}>
                                {new Date(message.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 text-df-fog mx-auto mb-4" />
                        <p className="text-df-fog">Start the conversation!</p>
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t border-df-steel p-4">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="input-df flex-1"
                        disabled={sendMessageMutation.isPending}
                        data-testid="input-message"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || sendMessageMutation.isPending}
                        className="btn-primary p-3"
                        data-testid="button-send-message"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-df-fog mx-auto mb-4" />
                  <h3 className="text-df-snow text-lg font-semibold mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-df-fog">
                    Choose a conversation from the left to start messaging
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
