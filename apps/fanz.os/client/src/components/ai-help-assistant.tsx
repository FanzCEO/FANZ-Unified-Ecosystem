import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Send, 
  Mic, 
  MicOff, 
  X, 
  ThumbsUp, 
  ThumbsDown,
  Book,
  Lightbulb,
  Settings,
  User,
  DollarSign,
  Camera,
  BarChart3,
  Shield,
  HelpCircle
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  helpful?: boolean;
  suggestions?: string[];
  category?: 'account' | 'content' | 'payments' | 'technical' | 'general';
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  category: string;
  action: string;
}

const quickActions: QuickAction[] = [
  { id: '1', label: 'Account Setup', icon: <User className="w-4 h-4" />, category: 'Account', action: 'How do I complete my account setup?' },
  { id: '2', label: 'Upload Content', icon: <Camera className="w-4 h-4" />, category: 'Content', action: 'Help me upload my first post' },
  { id: '3', label: 'Set Pricing', icon: <DollarSign className="w-4 h-4" />, category: 'Monetization', action: 'How do I set my subscription price?' },
  { id: '4', label: 'View Analytics', icon: <BarChart3 className="w-4 h-4" />, category: 'Analytics', action: 'Show me how to read my analytics' },
  { id: '5', label: 'Payment Issues', icon: <Settings className="w-4 h-4" />, category: 'Payments', action: 'I am having payment problems' },
  { id: '6', label: 'Safety & Privacy', icon: <Shield className="w-4 h-4" />, category: 'Safety', action: 'Help me secure my account' },
];

const commonTopics = [
  'Getting Started',
  'Content Creation',
  'Subscriptions',
  'Live Streaming',
  'Analytics',
  'Payments',
  'Technical Issues',
  'Account Settings'
];

export function AIHelpAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognition = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognition.current = new (window as any).webkitSpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';
      
      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      
      recognition.current.onerror = () => {
        setIsListening(false);
      };
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleVoiceInput = () => {
    if (!recognition.current) return;
    
    if (isListening) {
      recognition.current.stop();
      setIsListening(false);
    } else {
      recognition.current.start();
      setIsListening(true);
    }
  };

  const simulateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const lowerMessage = userMessage.toLowerCase();
    
    // Pattern matching for common questions
    if (lowerMessage.includes('upload') || lowerMessage.includes('post')) {
      return "I'll help you upload content! Here's a step-by-step guide:\n\n1. Click the 'Create Post' button in your dashboard\n2. Drag and drop your files or click 'Browse Files'\n3. Add a caption and hashtags\n4. Set your content visibility (Free, Subscription-only, or PPV)\n5. Click 'Publish' to share your content\n\nSupported formats include JPG, PNG, MP4, and MOV files up to 2GB. Would you like me to explain any of these steps in more detail?";
    }
    
    if (lowerMessage.includes('subscription') || lowerMessage.includes('price')) {
      return "Setting the right subscription price is crucial for your success! Here are some guidelines:\n\n**For New Creators:**\n- Start with $4.99-9.99/month to attract initial subscribers\n- Consider offering a limited-time discount\n\n**Pricing Factors:**\n- Content frequency (daily posters can charge more)\n- Content quality and uniqueness\n- Your niche market rates\n\n**Tips:**\n- Research similar creators in your category\n- You can always adjust prices later\n- Offer value beyond just content (personal messages, polls, etc.)\n\nWould you like help setting up your first subscription tier?";
    }
    
    if (lowerMessage.includes('payment') || lowerMessage.includes('payout')) {
      return "I can help with payment issues! Let me identify your specific situation:\n\n**For Creators (Getting Paid):**\n- Payouts process within 1-3 business days\n- Minimum payout is $20 for most methods\n- Check your banking details are correct\n\n**For Fans (Making Payments):**\n- We accept major credit cards, PayPal, and crypto\n- Check if your payment method is valid and has sufficient funds\n- Try a different payment method if one fails\n\n**Common Solutions:**\n- Clear browser cache and cookies\n- Try a different browser or device\n- Contact your bank about international transactions\n\nWhat specific payment issue are you experiencing?";
    }
    
    if (lowerMessage.includes('analytics') || lowerMessage.includes('dashboard')) {
      return "Your analytics dashboard shows key performance metrics! Here's what each section means:\n\n**Revenue Section:**\n- Total earnings (today, week, month)\n- Breakdown by subscriptions, tips, and PPV sales\n- Growth trends and projections\n\n**Subscriber Metrics:**\n- Current subscriber count\n- New subscribers vs. cancellations\n- Retention rates\n\n**Content Performance:**\n- Most popular posts\n- Engagement rates (likes, comments, shares)\n- Best posting times\n\n**Tips for Improvement:**\n- Post consistently for better engagement\n- Engage with your subscribers' comments\n- Use analytics to optimize your posting schedule\n\nWhich metric would you like me to explain in more detail?";
    }
    
    if (lowerMessage.includes('live stream') || lowerMessage.includes('streaming')) {
      return "Let's get your live streaming set up! Here's what you need:\n\n**Technical Requirements:**\n- Stable internet (5+ Mbps upload speed)\n- HD camera (webcam or phone)\n- Good lighting and audio\n\n**Starting a Stream:**\n1. Click 'Go Live' from your dashboard\n2. Set stream title and category\n3. Choose audience (public, subscribers, or ticketed)\n4. Test your camera and microphone\n5. Click 'Start Streaming'\n\n**Engagement Tips:**\n- Interact with chat regularly\n- Set tip goals to encourage donations\n- Plan your content ahead of time\n- Promote your stream on social media\n\nWould you like help troubleshooting any specific streaming issues?";
    }
    
    if (lowerMessage.includes('account') || lowerMessage.includes('profile')) {
      return "I'll help you optimize your account! Here are the key areas to focus on:\n\n**Profile Essentials:**\n- Professional profile photo\n- Compelling bio with keywords\n- Clear description of your content\n- Links to your other social platforms\n\n**Account Settings:**\n- Complete age verification\n- Set up two-factor authentication\n- Configure privacy and notification settings\n- Add payment methods\n\n**For Creators:**\n- Upload banner image\n- Set subscription price\n- Create your first free post to attract followers\n- Add tax information for payouts\n\nWhat specific aspect of your account would you like help with?";
    }
    
    // Default response
    return "I'm here to help with any FansLab questions! I can assist with:\n\n• Account setup and verification\n• Content creation and upload\n• Subscription and pricing strategies\n• Payment and payout issues\n• Live streaming setup\n• Analytics and performance\n• Technical troubleshooting\n• Safety and privacy settings\n\nWhat specific topic would you like help with? You can also click one of the quick action buttons below for common tasks.";
  };

  const handleSendMessage = async (message?: string) => {
    const messageText = message || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await simulateAIResponse(messageText);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        isUser: false,
        timestamp: new Date(),
        suggestions: ['Was this helpful?', 'Need more details?', 'Try something else?']
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I encountered an error. Please try again or contact support if the problem persists.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    handleSendMessage(action.action);
  };

  const handleFeedback = (messageId: string, isHelpful: boolean) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, helpful: isHelpful } : msg
    ));
  };

  const resetChat = () => {
    setMessages([]);
    setSelectedTopic(null);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg z-50"
        data-testid="ai-assistant-toggle"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            AI Assistant
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={resetChat} data-testid="reset-chat">
              Reset
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} data-testid="close-assistant">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Hi! I'm your AI assistant. I can help with any questions about FansLab features and functionality.
            </div>
            
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground mb-2">Quick Actions</div>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    className="h-auto p-2 text-xs justify-start"
                    onClick={() => handleQuickAction(action)}
                    data-testid={`quick-action-${action.id}`}
                  >
                    {action.icon}
                    <span className="ml-1 truncate">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Popular Topics</div>
              <div className="flex flex-wrap gap-1">
                {commonTopics.map((topic) => (
                  <Badge
                    key={topic}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs"
                    onClick={() => handleSendMessage(`Help me with ${topic}`)}
                    data-testid={`topic-${topic.replace(' ', '-').toLowerCase()}`}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    message.isUser 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    {!message.isUser && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/10">
                        <div className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleFeedback(message.id, true)}
                            data-testid={`thumbs-up-${message.id}`}
                          >
                            <ThumbsUp className={`w-3 h-3 ${message.helpful === true ? 'text-green-500' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleFeedback(message.id, false)}
                            data-testid={`thumbs-down-${message.id}`}
                          >
                            <ThumbsDown className={`w-3 h-3 ${message.helpful === false ? 'text-red-500' : ''}`} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
        )}

        <div className="flex items-center gap-2 pt-3 border-t">
          <div className="flex-1 flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about FansLab..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
              className="flex-1"
              data-testid="ai-input"
            />
            {recognition.current && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleVoiceInput}
                disabled={isLoading}
                className={isListening ? 'bg-red-500 text-white' : ''}
                data-testid="voice-input"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}
          </div>
          <Button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            size="sm"
            data-testid="send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
            AI is thinking...
          </div>
        )}
      </CardContent>
    </Card>
  );
}