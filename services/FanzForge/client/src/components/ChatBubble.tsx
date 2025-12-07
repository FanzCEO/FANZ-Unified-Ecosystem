import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  sender: 'user' | 'support' | 'ai';
  senderName: string;
  avatar?: string;
}

interface ChatBubbleProps {
  position?: 'bottom-right' | 'bottom-left';
}

export default function ChatBubble({ position = 'bottom-right' }: ChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! How can I help you today? 👋',
      timestamp: new Date(),
      sender: 'support',
      senderName: 'Support Team'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      timestamp: new Date(),
      sender: 'user',
      senderName: 'You'
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage("");
    setIsTyping(true);

    // Simulate AI/support response
    setTimeout(() => {
      setIsTyping(false);
      const responses = [
        "Thanks for reaching out! I'll help you with that right away.",
        "That's a great question! Let me look into that for you.",
        "I understand your concern. Here's what I recommend...",
        "Perfect! I can definitely help you with that feature.",
        "Let me connect you with the right documentation for that.",
      ];
      
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        sender: Math.random() > 0.5 ? 'ai' : 'support',
        senderName: Math.random() > 0.5 ? 'AI Assistant' : 'Support Team'
      };

      setMessages(prev => [...prev, responseMessage]);
      
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <Card className="w-80 h-96 shadow-2xl border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                      <i className="fas fa-comments text-sm text-white"></i>
                    </div>
                    <div>
                      <CardTitle className="text-sm">Support Chat</CardTitle>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Online</span>
                      </div>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsOpen(false)}
                        className="h-6 w-6 p-0"
                        data-testid="button-close-chat"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Close chat</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              
              <CardContent className="p-0 flex flex-col h-full">
                <ScrollArea className="flex-1 px-4">
                  <div className="space-y-4 pb-4">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] ${msg.sender === 'user' ? 'order-2' : 'order-1'}`}>
                          <div className={`flex items-center space-x-1 mb-1 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-xs text-muted-foreground">{msg.senderName}</span>
                            {msg.sender === 'ai' && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                <i className="fas fa-robot mr-1"></i>AI
                              </Badge>
                            )}
                          </div>
                          <div
                            className={`px-3 py-2 rounded-lg ${
                              msg.sender === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : msg.sender === 'ai'
                                ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{msg.text}</p>
                            <p className={`text-xs mt-1 ${
                              msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {formatTime(msg.timestamp)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-muted px-3 py-2 rounded-lg">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1"
                      data-testid="input-chat-message"
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleSendMessage}
                          disabled={!message.trim()}
                          size="sm"
                          data-testid="button-send-message"
                        >
                          <i className="fas fa-paper-plane"></i>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Send message (Enter)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Toggle Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => setIsOpen(!isOpen)}
              className="relative w-14 h-14 rounded-full shadow-lg bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              data-testid="button-toggle-chat"
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.i
                    key="close"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    className="fas fa-times text-lg"
                  />
                ) : (
                  <motion.i
                    key="chat"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    className="fas fa-comments text-lg"
                  />
                )}
              </AnimatePresence>

              {unreadCount > 0 && !isOpen && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.div>
              )}
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isOpen ? 'Close chat' : 'Open support chat'}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}