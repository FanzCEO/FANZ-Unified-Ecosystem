import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  Settings,
  MessageSquare,
  Brain,
  Zap,
  Star,
  Download,
  Copy,
  RefreshCw
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatPersona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  icon: string;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedPersona, setSelectedPersona] = useState("general");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const personas: ChatPersona[] = [
    {
      id: "general",
      name: "General Assistant",
      description: "Helpful AI assistant for any topic",
      systemPrompt: "You are a helpful, knowledgeable, and friendly AI assistant.",
      icon: "🤖"
    },
    {
      id: "copywriter",
      name: "Copywriter",
      description: "Expert in marketing and sales copy",
      systemPrompt: "You are an expert copywriter specializing in persuasive marketing content and sales copy.",
      icon: "✍️"
    },
    {
      id: "developer",
      name: "Developer",
      description: "Coding and technical assistance",
      systemPrompt: "You are an expert software developer proficient in multiple programming languages and frameworks.",
      icon: "💻"
    },
    {
      id: "business",
      name: "Business Advisor",
      description: "Strategic business guidance",
      systemPrompt: "You are a strategic business advisor with expertise in entrepreneurship, finance, and growth strategies.",
      icon: "💼"
    },
    {
      id: "creative",
      name: "Creative Writer",
      description: "Stories, content, and creative writing",
      systemPrompt: "You are a creative writer skilled in storytelling, content creation, and imaginative writing.",
      icon: "🎨"
    },
    {
      id: "analyst",
      name: "Data Analyst",
      description: "Data insights and analysis",
      systemPrompt: "You are a data analyst expert in interpreting data, creating insights, and making data-driven recommendations.",
      icon: "📊"
    }
  ];

  const chatMutation = useMutation({
    mutationFn: async (data: { message: string; persona: string; messages: Message[] }) => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: data.message,
          persona: data.persona,
          conversationHistory: data.messages.slice(-10) // Last 10 messages for context
        })
      });
      const result = await response.json();
      return result.reply;
    },
    onSuccess: (response) => {
      const assistantMessage: Message = {
        id: Date.now().toString() + "-assistant",
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    },
    onError: (error: any) => {
      console.error('Chat error:', error);
      setIsTyping(false);
      toast({
        title: "Error",
        description: "Failed to get response from AI. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString() + "-user",
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    chatMutation.mutate({
      message: input.trim(),
      persona: selectedPersona,
      messages: [...messages, userMessage]
    });
    
    setInput("");
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard"
    });
  };

  const clearChat = () => {
    setMessages([]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const selectedPersonaData = personas.find(p => p.id === selectedPersona) || personas[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Chat Assistant</h1>
          <p className="text-gray-600">Have intelligent conversations with AI. Choose a persona for specialized assistance.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Chat Settings */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings size={20} />
                  Chat Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">AI Persona</label>
                  <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {personas.map((persona) => (
                        <SelectItem key={persona.id} value={persona.id}>
                          <div className="flex items-center gap-2">
                            <span>{persona.icon}</span>
                            <span>{persona.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{selectedPersonaData.icon}</span>
                    <span className="font-semibold text-gray-900">{selectedPersonaData.name}</span>
                  </div>
                  <p className="text-sm text-gray-600">{selectedPersonaData.description}</p>
                </div>

                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={clearChat}
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Clear Chat
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download size={16} className="mr-2" />
                    Export Chat
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap size={20} />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => setInput("Write a persuasive email subject line for a product launch")}
                >
                  <div>
                    <div className="font-medium">Email Subject</div>
                    <div className="text-xs text-gray-500">Generate compelling email subjects</div>
                  </div>
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => setInput("Help me debug this JavaScript function")}
                >
                  <div>
                    <div className="font-medium">Debug Code</div>
                    <div className="text-xs text-gray-500">Get coding assistance</div>
                  </div>
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => setInput("Create a social media strategy for my business")}
                >
                  <div>
                    <div className="font-medium">Strategy</div>
                    <div className="text-xs text-gray-500">Business planning help</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-xl">{selectedPersonaData.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedPersonaData.name}</h3>
                      <p className="text-sm text-gray-500">Active • Ready to help</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{messages.length} messages</span>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-0">
                <div className="p-6 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="text-white" size={24} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a conversation</h3>
                      <p className="text-gray-600 mb-4">Ask me anything! I'm here to help with your questions and tasks.</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setInput("What can you help me with?")}
                        >
                          What can you do?
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setInput("Help me write a blog post about AI")}
                        >
                          Write content
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setInput("Explain quantum computing simply")}
                        >
                          Explain concepts
                        </Button>
                      </div>
                    </div>
                  )}

                  {messages.map((message) => (
                    <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="text-white" size={16} />
                        </div>
                      )}
                      
                      <div className={`max-w-[80%] ${message.role === 'user' ? 'order-1' : ''}`}>
                        <div className={`rounded-2xl p-4 ${
                          message.role === 'user' 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2 px-2">
                          <span className="text-xs text-gray-500">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                          {message.role === 'assistant' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                              onClick={() => copyMessage(message.content)}
                            >
                              <Copy size={12} />
                            </Button>
                          )}
                        </div>
                      </div>

                      {message.role === 'user' && (
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="text-white" size={16} />
                        </div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Bot className="text-white" size={16} />
                      </div>
                      <div className="bg-gray-100 rounded-2xl p-4">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your message..."
                      className="resize-none border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      data-testid="chat-input"
                    />
                  </div>
                  <Button 
                    onClick={handleSend}
                    disabled={!input.trim() || chatMutation.isPending}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 transition-transform rounded-xl"
                    data-testid="chat-send"
                  >
                    <Send size={20} />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>Press Enter to send, Shift+Enter for new line</span>
                  <span>{input.length}/2000</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}