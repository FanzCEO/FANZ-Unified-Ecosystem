import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { User, ConversationWithParticipant, MessageWithSender } from "@shared/schema";
import { Search, Plus, MoreHorizontal, Phone, Video, Info } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";


export default function Messages() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });
  
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<ConversationWithParticipant[]>({
    queryKey: ["/api/conversations"],
  });
  
  const { data: messages = [], isLoading: messagesLoading } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/conversations", selectedConversationId, "messages"],
    enabled: !!selectedConversationId,
  });
  
  const selectedConversation = conversations.find(conv => conv.id === selectedConversationId) || conversations[0];
  
  const getTimeAgo = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  const formatMessageTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date));
  };

  return (
    <div className="min-h-screen bg-black text-white cyber-grid">
      <Header />
      
      <div className="flex flex-col lg:flex-row pt-14 sm:pt-16 pb-16 lg:pb-0">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        <main className="flex-1 lg:ml-64 max-w-full mx-auto">
          <div className="flex h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)]">
            {/* Conversations List */}
            <div className="w-full lg:w-80 post-card m-3 sm:m-4 lg:m-6 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-bold text-cyber-blue neon-text">Messages</h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 text-gray-400 hover:text-cyber-blue transition-colors"
                    data-testid="new-message"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search messages..."
                    className="cyber-input w-full rounded-full px-4 py-2 pl-10 text-white placeholder-gray-400"
                    data-testid="search-messages"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>
              
              <div className="overflow-y-auto flex-1">
                {conversationsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="w-6 h-6 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2 text-gray-400">Loading conversations...</span>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyber-blue/20 to-electric-purple/20 flex items-center justify-center border border-cyber-blue/30">
                      <Plus className="w-8 h-8 text-cyber-blue" />
                    </div>
                    <h3 className="text-lg font-semibold text-cyber-blue mb-2">No conversations yet</h3>
                    <p className="text-gray-400 text-sm max-w-sm mx-auto">
                      Start a conversation with someone to see your messages here!
                    </p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversationId(conversation.id)}
                      className={`flex items-center space-x-3 p-4 hover:bg-gray-800/50 cursor-pointer transition-colors ${
                        selectedConversationId === conversation.id ? 'border-l-2 border-cyber-blue bg-cyber-blue/10' : ''
                      }`}
                      data-testid={`conversation-${conversation.id}`}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full border border-neon-pink overflow-hidden">
                          <img
                            src={conversation.participant.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face"}
                            alt={conversation.participant.displayName || "Unknown"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-laser-green rounded-full border-2 border-black"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-white truncate">
                            {conversation.participant.displayName || "Unknown User"}
                          </h3>
                          <span className="text-xs text-gray-400">
                            {conversation.lastMessageAt ? getTimeAgo(conversation.lastMessageAt) : ''}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 truncate">
                          {conversation.lastMessage?.content || "No messages yet"}
                        </p>
                      </div>
                      
                      {conversation.unreadCount > 0 && (
                        <div className="w-5 h-5 bg-neon-pink rounded-full flex items-center justify-center">
                          <span className="text-xs text-black font-bold">
                            {conversation.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Chat Area */}
            {selectedConversation ? (
              <div className="hidden lg:flex flex-1 post-card m-6 ml-0 rounded-xl overflow-hidden flex-col">
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full border border-neon-pink overflow-hidden">
                        <img
                          src={selectedConversation.participant.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face"}
                          alt={selectedConversation.participant.displayName || "Unknown"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-laser-green rounded-full border border-black"></div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{selectedConversation.participant.displayName || "Unknown User"}</h3>
                      <p className="text-xs text-laser-green">Online</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 text-gray-400 hover:text-cyber-blue transition-colors"
                      data-testid="voice-call"
                    >
                      <Phone className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 text-gray-400 hover:text-electric-purple transition-colors"
                      data-testid="video-call"
                    >
                      <Video className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 text-gray-400 hover:text-neon-pink transition-colors"
                      data-testid="chat-info"
                    >
                      <Info className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-6 h-6 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2 text-gray-400">Loading messages...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyber-blue/20 to-electric-purple/20 flex items-center justify-center border border-cyber-blue/30">
                          <Plus className="w-8 h-8 text-cyber-blue" />
                        </div>
                        <h3 className="text-lg font-semibold text-cyber-blue mb-2">Start the conversation</h3>
                        <p className="text-gray-400 text-sm">
                          Send the first message to get the conversation started!
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isFromCurrentUser = message.senderId === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              isFromCurrentUser
                                ? 'bg-gradient-to-r from-cyber-blue to-electric-purple text-black'
                                : 'bg-gray-800 text-white border border-gray-700'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isFromCurrentUser ? 'text-black/70' : 'text-gray-400'
                            }`}>
                              {formatMessageTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                
                {/* Message Input */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      placeholder="Type a message..."
                      className="cyber-input flex-1 rounded-full px-4 py-2 text-white placeholder-gray-400"
                      data-testid="message-input"
                    />
                    <Button
                      className="neon-button bg-gradient-to-r from-cyber-blue to-electric-purple text-black font-bold px-6 py-2 rounded-full border-cyber-blue hover:shadow-neon-cyan transition-all duration-300"
                      data-testid="send-message"
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex flex-1 post-card m-6 ml-0 rounded-xl overflow-hidden items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyber-blue/20 to-electric-purple/20 flex items-center justify-center border border-cyber-blue/30">
                    <Plus className="w-8 h-8 text-cyber-blue" />
                  </div>
                  <h3 className="text-lg font-semibold text-cyber-blue mb-2">Select a conversation</h3>
                  <p className="text-gray-400 text-sm">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}