import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Send,
  Paperclip,
  Heart,
  Gift,
  Image,
  Video,
  MoreVertical,
  Search,
  Star,
  Lock,
  Check,
  CheckCheck,
  Clock,
  DollarSign,
  MessageCircle
} from "lucide-react";
import type { User } from "@shared/schema";

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  isPaid?: boolean;
  price?: number;
  attachments?: {
    type: "image" | "video";
    url: string;
    thumbnail?: string;
  }[];
}

interface Conversation {
  userId: string;
  userName: string;
  userAvatar: string;
  isCreator: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline?: boolean;
}

export default function Messages() {
  const { user } = useAuth() as { user: User | undefined };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/messages/conversations"],
    enabled: !!user,
  });

  // Fetch messages for selected conversation
  const { data: messages } = useQuery<Message[]>({
    queryKey: [`/api/messages/${selectedConversation}`],
    enabled: !!selectedConversation,
  });

  // Mock data for demonstration
  const mockConversations: Conversation[] = conversations || [
    {
      userId: "creator1",
      userName: "Emma Rose",
      userAvatar: "https://images.unsplash.com/photo-1494790108344-b2ee30e40a34?w=100&h=100&fit=crop&crop=face",
      isCreator: true,
      lastMessage: "Thanks for your support! 💕",
      lastMessageTime: "2 hours ago",
      unreadCount: 2,
      isOnline: true,
    },
    {
      userId: "creator2",
      userName: "Sophia Luna",
      userAvatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop&crop=face",
      isCreator: true,
      lastMessage: "New exclusive content coming soon!",
      lastMessageTime: "5 hours ago",
      unreadCount: 0,
      isOnline: false,
    },
    {
      userId: "fan1",
      userName: "John Doe",
      userAvatar: "",
      isCreator: false,
      lastMessage: "Hey, love your content!",
      lastMessageTime: "1 day ago",
      unreadCount: 1,
      isOnline: true,
    },
  ];

  const mockMessages: Message[] = messages || [
    {
      id: "1",
      senderId: selectedConversation || "creator1",
      recipientId: user?.id || "user1",
      content: "Hey! Thanks for subscribing to my page 💕",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      isRead: true,
    },
    {
      id: "2",
      senderId: user?.id || "user1",
      recipientId: selectedConversation || "creator1",
      content: "Love your content! You're amazing!",
      createdAt: new Date(Date.now() - 82800000).toISOString(),
      isRead: true,
    },
    {
      id: "3",
      senderId: selectedConversation || "creator1",
      recipientId: user?.id || "user1",
      content: "Thank you so much! I have some exclusive content for my top fanz. Would you be interested?",
      createdAt: new Date(Date.now() - 79200000).toISOString(),
      isRead: true,
    },
    {
      id: "4",
      senderId: selectedConversation || "creator1",
      recipientId: user?.id || "user1",
      content: "Check out this preview 😊",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      isRead: true,
      attachments: [
        {
          type: "image",
          url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=300&fit=crop",
          thumbnail: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
        },
      ],
    },
    {
      id: "5",
      senderId: selectedConversation || "creator1",
      recipientId: user?.id || "user1",
      content: "Unlock this exclusive video for $9.99",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      isRead: false,
      isPaid: false,
      price: 9.99,
      attachments: [
        {
          type: "video",
          url: "",
          thumbnail: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop",
        },
      ],
    },
  ];

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { recipientId: string; content: string }) => {
      const response = await apiRequest("POST", "/api/messages", data);
      return response.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${selectedConversation}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (senderId: string) => {
      const response = await apiRequest("PUT", `/api/messages/${senderId}/read`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
  });

  const handleSendMessage = () => {
    if (messageText.trim() && selectedConversation) {
      sendMessageMutation.mutate({
        recipientId: selectedConversation,
        content: messageText,
      });
    }
  };

  const handleConversationSelect = (userId: string) => {
    setSelectedConversation(userId);
    markAsReadMutation.mutate(userId);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const filteredConversations = mockConversations.filter(conv =>
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedUser = mockConversations.find(conv => conv.userId === selectedConversation);
  const displayMessages = selectedConversation ? mockMessages : [];

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8" data-testid="text-messages-title">Messages</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="bg-gray-800 border-gray-700 lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Conversations</CardTitle>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-700 border-gray-600 pl-10 text-white"
                  data-testid="input-search-conversations"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="w-full bg-gray-700 rounded-none">
                  <TabsTrigger value="all" className="flex-1" data-testid="tab-all-messages">All</TabsTrigger>
                  <TabsTrigger value="unread" className="flex-1" data-testid="tab-unread-messages">Unread</TabsTrigger>
                  <TabsTrigger value="paid" className="flex-1" data-testid="tab-paid-messages">Paid</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="m-0">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-1 p-2">
                      {filteredConversations.map((conv) => (
                        <div
                          key={conv.userId}
                          onClick={() => handleConversationSelect(conv.userId)}
                          className={`
                            p-3 rounded-lg cursor-pointer transition-colors
                            ${selectedConversation === conv.userId 
                              ? 'bg-primary/20 border border-primary/40' 
                              : 'hover:bg-gray-700'
                            }
                          `}
                          data-testid={`conversation-${conv.userId}`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="relative">
                              <Avatar>
                                <AvatarImage src={conv.userAvatar} alt={conv.userName} />
                                <AvatarFallback>{conv.userName[0]}</AvatarFallback>
                              </Avatar>
                              {conv.isOnline && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-2">
                                  <p className="font-semibold text-white truncate">{conv.userName}</p>
                                  {conv.isCreator && (
                                    <Badge variant="secondary" className="text-xs bg-purple-900 text-purple-400">
                                      Creator
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-gray-400">{conv.lastMessageTime}</span>
                              </div>
                              <p className="text-sm text-gray-400 truncate">{conv.lastMessage}</p>
                            </div>
                            {conv.unreadCount > 0 && (
                              <Badge className="bg-primary text-white">{conv.unreadCount}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="unread" className="m-0">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-1 p-2">
                      {filteredConversations.filter(c => c.unreadCount > 0).map((conv) => (
                        <div
                          key={conv.userId}
                          onClick={() => handleConversationSelect(conv.userId)}
                          className="p-3 rounded-lg cursor-pointer hover:bg-gray-700"
                        >
                          <div className="flex items-start space-x-3">
                            <Avatar>
                              <AvatarImage src={conv.userAvatar} alt={conv.userName} />
                              <AvatarFallback>{conv.userName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold text-white">{conv.userName}</p>
                              <p className="text-sm text-gray-400 truncate">{conv.lastMessage}</p>
                            </div>
                            <Badge className="bg-primary text-white">{conv.unreadCount}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Messages Area */}
          <Card className="bg-gray-800 border-gray-700 lg:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={selectedUser?.userAvatar} alt={selectedUser?.userName} />
                        <AvatarFallback>{selectedUser?.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-white">{selectedUser?.userName}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          {selectedUser?.isOnline && (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              <span>Online</span>
                            </>
                          )}
                          {selectedUser?.isCreator && (
                            <Badge variant="secondary" className="text-xs bg-purple-900 text-purple-400">
                              Creator
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-[400px] p-4">
                    <div className="space-y-4">
                      {displayMessages.map((message) => {
                        const isSent = message.senderId === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] ${isSent ? 'order-2' : 'order-1'}`}>
                              <div
                                className={`
                                  rounded-lg p-3
                                  ${isSent 
                                    ? 'bg-primary text-white' 
                                    : 'bg-gray-700 text-white'
                                  }
                                `}
                              >
                                <p className="text-sm">{message.content}</p>
                                
                                {/* Paid Content */}
                                {message.isPaid !== undefined && !message.isPaid && (
                                  <div className="mt-2 p-3 bg-black/20 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs opacity-75">Premium Content</span>
                                      <Lock className="w-4 h-4" />
                                    </div>
                                    {message.attachments?.[0]?.thumbnail && (
                                      <div className="relative mb-2">
                                        <img
                                          src={message.attachments[0].thumbnail}
                                          alt="Premium content"
                                          className="w-full h-32 object-cover rounded blur-lg"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="bg-black/60 rounded-lg p-3">
                                            <Lock className="w-8 h-8 mb-1" />
                                            <p className="text-xs">Unlock for ${message.price}</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    <Button
                                      size="sm"
                                      className="w-full bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                                      data-testid={`button-unlock-${message.id}`}
                                    >
                                      <DollarSign className="w-4 h-4 mr-1" />
                                      Unlock for ${message.price}
                                    </Button>
                                  </div>
                                )}

                                {/* Regular Attachments */}
                                {message.attachments && message.isPaid !== false && (
                                  <div className="mt-2 space-y-2">
                                    {message.attachments.map((attachment, index) => (
                                      <div key={index}>
                                        {attachment.type === "image" && (
                                          <img
                                            src={attachment.url}
                                            alt="Attachment"
                                            className="rounded-lg max-w-full"
                                          />
                                        )}
                                        {attachment.type === "video" && (
                                          <div className="relative">
                                            <Video className="w-8 h-8 absolute top-2 left-2 text-white" />
                                            <video
                                              src={attachment.url}
                                              controls
                                              className="rounded-lg max-w-full"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              <div className={`flex items-center space-x-2 mt-1 text-xs text-gray-400 ${isSent ? 'justify-end' : 'justify-start'}`}>
                                <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {isSent && (
                                  message.isRead ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>

                {/* Message Input */}
                <div className="border-t border-gray-700 p-4">
                  <div className="flex items-end space-x-2">
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <Paperclip className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <Image className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <Gift className="w-5 h-5" />
                      </Button>
                    </div>
                    
                    <Textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-gray-700 border-gray-600 text-white resize-none"
                      rows={1}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      data-testid="textarea-message-input"
                    />
                    
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                      data-testid="button-send-message"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <Heart className="w-4 h-4 mr-2" />
                      Send Tip
                    </Button>
                    <span className="text-xs text-gray-500">
                      Press Enter to send, Shift+Enter for new line
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}