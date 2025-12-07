import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Send, Paperclip, Lock } from "lucide-react";

export default function Messages() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect to login if not authenticated
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

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/conversations"],
    retry: false,
  });

  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ["/api/messages", selectedConversation?.otherUser.id],
    enabled: !!selectedConversation,
    retry: false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: string; content: string }) => {
      return await apiRequest("POST", "/api/messages", data);
    },
    onSuccess: () => {
      setMessageText("");
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
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
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      receiverId: selectedConversation.otherUser.id,
      content: messageText,
    });
  };

  const filteredConversations = (conversations || []).filter((conv: any) =>
    conv.otherUser.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.conversation.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading || conversationsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <MobileNav />
      
      <div className="lg:pl-64 pb-20 lg:pb-0">
        <div className="flex h-screen">
          {/* Chat List */}
          <div className="w-full lg:w-80 bg-card border-r border-border flex flex-col" data-testid="section-chat-list">
            {/* Chat Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold" data-testid="text-messages-title">Messages</h2>
                <Button 
                  className="gradient-bg text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
                  data-testid="button-send-blast"
                >
                  Send Blast
                </Button>
              </div>
              <div className="mt-3">
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-input border-border"
                  data-testid="input-search-conversations"
                />
              </div>
            </div>

            {/* Chat Filters */}
            <div className="p-4 border-b border-border">
              <div className="flex space-x-2">
                <button className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs" data-testid="filter-all">
                  All
                </button>
                <button className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs hover:bg-accent/10" data-testid="filter-unread">
                  Unread
                </button>
                <button className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs hover:bg-accent/10" data-testid="filter-vip">
                  VIP
                </button>
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto" data-testid="list-conversations">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conv: any) => (
                  <div 
                    key={conv.conversation.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 border-b border-border hover:bg-accent/5 cursor-pointer transition-colors ${
                      selectedConversation?.conversation.id === conv.conversation.id ? 'bg-accent/10' : ''
                    }`}
                    data-testid={`conversation-item-${conv.conversation.id}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <img 
                          src={conv.otherUser.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.otherUser.email}`} 
                          alt="Chat user" 
                          className="w-12 h-12 rounded-full object-cover"
                          data-testid={`img-conversation-avatar-${conv.conversation.id}`}
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate" data-testid={`text-conversation-user-${conv.conversation.id}`}>
                            {conv.otherUser.firstName} {conv.otherUser.lastName}
                          </p>
                          <span className="text-xs text-muted-foreground" data-testid={`text-conversation-timestamp-${conv.conversation.id}`}>
                            {new Date(conv.conversation.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate" data-testid={`text-conversation-content-${conv.conversation.id}`}>
                          {conv.conversation.content}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">VIP Member</span>
                          {!conv.conversation.isRead && (
                            <div className="w-2 h-2 bg-secondary rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center" data-testid="empty-conversations">
                  <p className="text-muted-foreground">No conversations yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="hidden lg:flex lg:flex-1 lg:flex-col" data-testid="section-chat-interface">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-border bg-card">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={selectedConversation.otherUser.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedConversation.otherUser.email}`} 
                      alt="Chat user" 
                      className="w-10 h-10 rounded-full object-cover"
                      data-testid="img-active-chat-user"
                    />
                    <div>
                      <p className="font-medium" data-testid="text-active-chat-name">
                        {selectedConversation.otherUser.firstName} {selectedConversation.otherUser.lastName}
                      </p>
                      <p className="text-xs text-green-500">Online • VIP Member</p>
                    </div>
                    <div className="ml-auto flex space-x-2">
                      <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors" data-testid="button-view-profile">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      </button>
                      <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors" data-testid="button-block-user">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="list-messages">
                  {(messages || []).length > 0 ? (
                    (messages || []).map((message: any) => (
                      <div 
                        key={message.id}
                        className={`flex ${message.senderId === selectedConversation.otherUser.id ? 'justify-start' : 'justify-end'}`}
                        data-testid={`message-${message.id}`}
                      >
                        <div className={`max-w-xs rounded-lg px-4 py-2 ${
                          message.senderId === selectedConversation.otherUser.id 
                            ? 'bg-muted text-foreground rounded-bl-sm' 
                            : 'bg-primary text-primary-foreground rounded-br-sm'
                        }`}>
                          <p className="text-sm" data-testid={`text-message-content-${message.id}`}>
                            {message.content}
                          </p>
                          <p className={`text-xs mt-1 ${
                            message.senderId === selectedConversation.otherUser.id 
                              ? 'text-muted-foreground' 
                              : 'opacity-80'
                          }`} data-testid={`text-message-time-${message.id}`}>
                            {new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8" data-testid="empty-messages">
                      <p className="text-muted-foreground">Start a conversation</p>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex items-end space-x-3">
                    <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors" data-testid="button-attach-media">
                      <Paperclip className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors" data-testid="button-add-paywall">
                      <Lock className="w-5 h-5 text-primary" />
                    </button>
                    <Textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 resize-none bg-input border-border"
                      rows={1}
                      onKeyDown={(e) => {
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
                      className="gradient-bg text-white p-3 rounded-lg hover:opacity-90 transition-opacity"
                      data-testid="button-send-message"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center" data-testid="no-conversation-selected">
                <div className="text-center">
                  <svg className="w-16 h-16 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                  <p className="text-muted-foreground">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
