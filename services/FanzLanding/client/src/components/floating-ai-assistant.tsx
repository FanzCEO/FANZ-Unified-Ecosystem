import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  MessageCircle,
  X,
  ChevronUp,
  ChevronDown,
  Sparkles,
  BookOpen,
  PlayCircle,
  Shield,
  Users,
  Zap,
  Heart,
  Star,
  ArrowRight,
  HelpCircle,
  Settings,
} from "lucide-react";
import { useLocation } from "wouter";
import type { AiTour } from "@shared/schema";

interface ChatMessage {
  id: string;
  type: "bot" | "user";
  content: string;
  timestamp: Date;
  actionButtons?: Array<{
    label: string;
    action: () => void;
    variant?: "default" | "outline" | "secondary";
  }>;
}

export default function FloatingAIAssistant() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentView, setCurrentView] = useState<"chat" | "tours" | "help">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [location] = useLocation();

  // Query for AI tours
  const { data: aiTours } = useQuery<AiTour[]>({
    queryKey: ["/api/ai-tours"],
  });

  // Initialize welcome message based on current page
  useEffect(() => {
    if (showWelcome) {
      const welcomeMessage = getContextualWelcome(location);
      setMessages([welcomeMessage]);
      setShowWelcome(false);
    }
  }, [location, showWelcome]);

  const getContextualWelcome = (currentPath: string): ChatMessage => {
    const baseId = Date.now().toString();
    
    if (currentPath === "/") {
      return {
        id: baseId,
        type: "bot",
        content: "✨ Welcome to FANZ! I'm your personal AI assistant. I can help you get started, navigate the platform, and discover amazing creators. What would you like to explore first?",
        timestamp: new Date(),
        actionButtons: [
          {
            label: "🚀 Start Platform Tour",
            action: () => startTour("platform-intro"),
            variant: "default"
          },
          {
            label: "👤 Creator Onboarding",
            action: () => startCreatorOnboarding(),
            variant: "outline"
          },
          {
            label: "🔐 Security Features",
            action: () => showSecurityInfo(),
            variant: "secondary"
          }
        ]
      };
    } else if (currentPath === "/platforms-services") {
      return {
        id: baseId,
        type: "bot",
        content: "🌟 Welcome to the Platform Ecosystem! Here you can explore all 14 clusters in the FUN network. Need help launching a service or connecting to a platform?",
        timestamp: new Date(),
        actionButtons: [
          {
            label: "🎯 Service Launch Guide",
            action: () => startServiceGuide(),
            variant: "default"
          },
          {
            label: "🔗 Platform Integration",
            action: () => showPlatformIntegration(),
            variant: "outline"
          }
        ]
      };
    } else if (currentPath.includes("/register")) {
      return {
        id: baseId,
        type: "bot",
        content: "💫 Welcome to registration! I'll guide you through creating your account. Whether you're joining as a FAN or becoming a STAR creator, I'm here to help every step of the way.",
        timestamp: new Date(),
        actionButtons: [
          {
            label: "📋 Registration Help",
            action: () => showRegistrationHelp(),
            variant: "default"
          },
          {
            label: "⭐ Creator Benefits",
            action: () => showCreatorBenefits(),
            variant: "outline"
          }
        ]
      };
    } else if (currentPath.includes("/compliance")) {
      return {
        id: baseId,
        type: "bot",
        content: "🛡️ Security & Compliance Center. I'll help you understand our military-grade security measures and guide you through verification processes.",
        timestamp: new Date(),
        actionButtons: [
          {
            label: "🔒 Security Overview",
            action: () => showSecurityOverview(),
            variant: "default"
          },
          {
            label: "📄 Compliance Guide",
            action: () => showComplianceGuide(),
            variant: "outline"
          }
        ]
      };
    }

    return {
      id: baseId,
      type: "bot",
      content: "👋 Hey there! I'm your AI assistant for the FANZ platform. I can help you navigate, learn about features, and get the most out of your experience. How can I assist you today?",
      timestamp: new Date(),
      actionButtons: [
        {
          label: "🎯 Quick Start",
          action: () => showQuickStart(),
          variant: "default"
        },
        {
          label: "📚 All Tutorials",
          action: () => setCurrentView("tours"),
          variant: "outline"
        }
      ]
    };
  };

  const addMessage = (content: string, actionButtons?: ChatMessage['actionButtons']) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "bot",
      content,
      timestamp: new Date(),
      actionButtons
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const startTour = (tourType: string) => {
    addMessage("🚀 Great! Let me start the platform tour for you. This will help you understand all the amazing features available.", [
      {
        label: "✨ Begin Tour",
        action: () => {
          // This would integrate with the existing tour system
          addMessage("🎯 **Platform Tour Started!**\n\n1. **Networks**: Browse BoyFanz, GirlFanz, PupFanz and more\n2. **Services**: Launch FanzWork, FanzTube, FanzForge\n3. **Security**: Military-grade encryption & compliance\n4. **Creators**: Discover verified STARZ\n\nClick next to continue through each section!");
        },
        variant: "default"
      }
    ]);
  };

  const startCreatorOnboarding = () => {
    addMessage("⭐ **Creator Onboarding Guide**\n\nBecoming a STAR on FANZ involves:\n\n🔐 **Identity Verification** - Secure KYC process\n📄 **Legal Compliance** - 2257 record keeping\n💼 **Profile Setup** - Showcase your content\n💰 **Monetization** - Multiple revenue streams\n\nReady to start your creator journey?", [
      {
        label: "🚀 Start Registration",
        action: () => window.location.href = "/register?type=star",
        variant: "default"
      },
      {
        label: "📚 Learn More",
        action: () => showCreatorBenefits(),
        variant: "outline"
      }
    ]);
  };

  const showSecurityInfo = () => {
    addMessage("🛡️ **Military-Grade Security Features**\n\n🔐 **AES-256 Encryption** - Bank-level data protection\n📊 **Hash Chain Auditing** - Tamper-proof activity logs\n🔑 **Certificate Authentication** - Cryptographic cluster verification\n📋 **Policy Enforcement** - Real-time compliance monitoring\n🚨 **Threat Detection** - Advanced security monitoring\n\nYour safety and privacy are our top priorities!", [
      {
        label: "🔍 Security Dashboard",
        action: () => window.location.href = "/compliance",
        variant: "default"
      },
      {
        label: "📖 Security Guide",
        action: () => showSecurityOverview(),
        variant: "outline"
      }
    ]);
  };

  const startServiceGuide = () => {
    addMessage("🎯 **Service Launch Guide**\n\n✅ **FanzWork** - Freelancer marketplace\n🎥 **FanzTube** - Video content platform\n⚡ **FanzForge** - Development tools\n🎓 **FanzVarsity** - Education platform\n🛒 **FanzCommerce** - E-commerce solutions\n\nEach service has its own specialized features. Which would you like to explore?", [
      {
        label: "🚀 Launch Service",
        action: () => addMessage("Click any 'Launch' button on the services to open them in a new tab. Each service is optimized for its specific use case!"),
        variant: "default"
      },
      {
        label: "🔗 Integration Help",
        action: () => showPlatformIntegration(),
        variant: "outline"
      }
    ]);
  };

  const showPlatformIntegration = () => {
    addMessage("🔗 **Platform Integration**\n\n🌐 **Cross-Platform Access** - Single sign-on across all clusters\n⚡ **API Connections** - Integrate with external services\n🔄 **Data Sync** - Seamless information sharing\n📊 **Analytics** - Unified reporting dashboard\n\nAll platforms work together as one ecosystem!", [
      {
        label: "📝 API Docs",
        action: () => addMessage("API documentation is available for each platform. Click the 'API' button on any platform card to access developer resources."),
        variant: "outline"
      }
    ]);
  };

  const showRegistrationHelp = () => {
    addMessage("📋 **Registration Process**\n\n👤 **Personal Info** - Basic account details\n🔐 **Security Setup** - Strong password & 2FA\n📧 **Email Verification** - Confirm your email\n🎯 **Role Selection** - FAN or STAR creator\n\nThe process is designed to be quick and secure!", [
      {
        label: "🔒 Security Tips",
        action: () => addMessage("💡 **Security Tips**:\n• Use a unique, strong password\n• Enable 2FA for extra protection\n• Keep your recovery codes safe\n• Never share your credentials"),
        variant: "outline"
      }
    ]);
  };

  const showCreatorBenefits = () => {
    addMessage("⭐ **STAR Creator Benefits**\n\n💰 **Multiple Revenue Streams** - Subscriptions, tips, custom content\n🎯 **Advanced Analytics** - Detailed performance insights\n🛡️ **Privacy Protection** - Your content, your control\n📈 **Growth Tools** - Marketing and promotion features\n🤝 **Community Support** - Connect with other creators\n💎 **Exclusive Features** - Early access to new tools\n\n*'Creators > Platforms — you own your magic'*");
  };

  const showSecurityOverview = () => {
    addMessage("🛡️ **Security Overview**\n\n🔐 **Data Protection**\n- AES-256-GCM encryption\n- Zero-knowledge architecture\n- Secure key management\n\n📊 **Audit System**\n- Hash chain logging\n- Tamper detection\n- Real-time monitoring\n\n🔒 **Access Control**\n- Multi-factor authentication\n- Role-based permissions\n- Session management");
  };

  const showComplianceGuide = () => {
    addMessage("📄 **Compliance Guide**\n\n✅ **Legal Requirements**\n- Age verification (18+)\n- Identity confirmation\n- 2257 record keeping\n\n📋 **Verification Steps**\n1. Personal information\n2. Government ID upload\n3. Address verification\n4. Document signing\n\n🛡️ **Privacy Protection** - All data is encrypted and securely stored");
  };

  const showQuickStart = () => {
    addMessage("🎯 **Quick Start Guide**\n\n1. **Create Account** - Join as FAN or STAR\n2. **Verify Identity** - Quick security check\n3. **Explore Networks** - BoyFanz, GirlFanz, PupFanz\n4. **Launch Services** - Access specialized tools\n5. **Connect & Create** - Build your community\n\nWhere would you like to begin?", [
      {
        label: "👤 Sign Up",
        action: () => window.location.href = "/register",
        variant: "default"
      },
      {
        label: "🌍 Explore Networks",
        action: () => window.location.href = "/",
        variant: "outline"
      }
    ]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 hover:from-purple-600 hover:via-pink-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 relative overflow-hidden group"
          data-testid="button-open-ai-assistant"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center justify-center">
            <Bot className="w-8 h-8 text-white animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-bounce" />
          </div>
          <span className="sr-only">Open AI Assistant</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <Card className="border-2 border-purple-500/20 bg-card/95 backdrop-blur-sm shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  FANZ AI Assistant
                </CardTitle>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>Online & Ready</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-8 w-8 p-0"
                data-testid="button-minimize-ai-assistant"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-8 w-8 p-0"
                data-testid="button-close-ai-assistant"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-3">
            <Button
              variant={currentView === "chat" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView("chat")}
              className="text-xs"
              data-testid="tab-chat"
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              Chat
            </Button>
            <Button
              variant={currentView === "tours" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView("tours")}
              className="text-xs"
              data-testid="tab-tours"
            >
              <PlayCircle className="w-3 h-3 mr-1" />
              Tours
            </Button>
            <Button
              variant={currentView === "help" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView("help")}
              className="text-xs"
              data-testid="tab-help"
            >
              <HelpCircle className="w-3 h-3 mr-1" />
              Help
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {currentView === "chat" && (
            <div className="h-80">
              <ScrollArea className="h-full px-4">
                <div className="space-y-4 pb-4">
                  {messages.map((message) => (
                    <div key={message.id} className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                            <div className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatTime(message.timestamp)}
                            </div>
                          </div>
                          {message.actionButtons && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {message.actionButtons.map((button, index) => (
                                <Button
                                  key={index}
                                  variant={button.variant || "outline"}
                                  size="sm"
                                  onClick={button.action}
                                  className="text-xs"
                                  data-testid={`button-action-${index}`}
                                >
                                  {button.label}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {currentView === "tours" && (
            <div className="h-80 px-4">
              <ScrollArea className="h-full">
                <div className="space-y-3 pb-4">
                  <h3 className="font-semibold text-sm text-purple-400 mb-3">Available Tours & Tutorials</h3>
                  {aiTours?.map((tour) => (
                    <Card key={tour.id} className="border border-purple-500/20">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{tour.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{tour.description}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {tour.targetAudience}
                              </Badge>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Star className="w-3 h-3 mr-1 text-yellow-400" />
                                {tour.averageRating}/5
                              </div>
                            </div>
                          </div>
                          <Button size="sm" className="ml-2" data-testid={`start-tour-${tour.id}`}>
                            <PlayCircle className="w-3 h-3 mr-1" />
                            Start
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {currentView === "help" && (
            <div className="h-80 px-4">
              <ScrollArea className="h-full">
                <div className="space-y-3 pb-4">
                  <h3 className="font-semibold text-sm text-purple-400 mb-3">Quick Help & Resources</h3>
                  
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => {
                        setCurrentView("chat");
                        showQuickStart();
                      }}
                      data-testid="help-quick-start"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Quick Start Guide
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => {
                        setCurrentView("chat");
                        showSecurityInfo();
                      }}
                      data-testid="help-security"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Security Features
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => {
                        setCurrentView("chat");
                        showCreatorBenefits();
                      }}
                      data-testid="help-creator-benefits"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Creator Benefits
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => window.location.href = "/platforms-services"}
                      data-testid="help-services"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Platform Services
                    </Button>
                    
                    <Separator className="my-3" />
                    
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Heart className="w-4 h-4 text-pink-400" />
                        <span className="text-sm font-medium">Need More Help?</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        I'm here 24/7 to assist you with anything you need!
                      </p>
                      <Button
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          setCurrentView("chat");
                          addMessage("💬 **Live Support**\n\nI'm your dedicated AI assistant! I can help with:\n\n• Account setup & registration\n• Platform navigation\n• Creator onboarding\n• Security questions\n• Technical support\n• General guidance\n\nWhat would you like assistance with?");
                        }}
                        data-testid="help-live-support"
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Chat with Assistant
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}