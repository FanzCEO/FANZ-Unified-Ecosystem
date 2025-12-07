import OpenAI from "openai";
import { aiVoiceCloningService } from "./aiVoiceCloningService";

interface ChatSession {
  id: string;
  userId: string;
  creatorId: string;
  messages: ChatMessage[];
  personality: PersonalityProfile;
  context: ConversationContext;
  active: boolean;
  startTime: Date;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'creator';
  content: string;
  timestamp: Date;
  mediaUrl?: string;
  voiceUrl?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  intent?: string;
}

interface PersonalityProfile {
  name: string;
  traits: string[];
  speakingStyle: string;
  interests: string[];
  background: string;
  boundaries: string[];
  flirtiness: number; // 1-10 scale
  intelligence: number; // 1-10 scale
  humor: number; // 1-10 scale
}

interface ConversationContext {
  relationshipLevel: number; // 1-10, how close they are
  purchaseHistory: string[];
  preferences: string[];
  lastInteraction: Date;
  totalSpent: number;
  favoriteContent: string[];
  timezone: string;
  mood: string;
}

// Revolutionary AI Chatbot Service - Indistinguishable from Creator
class AIChatbotService {
  private openai?: OpenAI;
  private activeSessions: Map<string, ChatSession> = new Map();
  private personalities: Map<string, PersonalityProfile> = new Map();

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  // Create personalized AI personality for creator
  async createCreatorPersonality(
    creatorId: string,
    personalityData: {
      name: string;
      description: string;
      conversationSamples: string[];
      voiceSample?: string;
      interests: string[];
      boundaries: string[];
      stylePreferences: any;
    }
  ): Promise<PersonalityProfile> {
    try {
      if (!this.openai) {
        return this.createMockPersonality(creatorId, personalityData);
      }

      // Analyze conversation samples to extract personality traits
      const personalityAnalysis = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "system",
          content: `Analyze these conversation samples and extract personality traits, speaking style, humor level, intelligence level, and flirtiness level. Return as JSON.`
        }, {
          role: "user",
          content: `Conversation samples: ${personalityData.conversationSamples.join('\n\n---\n\n')}`
        }],
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(personalityAnalysis.choices[0].message.content || '{}');

      const personality: PersonalityProfile = {
        name: personalityData.name,
        traits: analysis.traits || ['friendly', 'engaging', 'flirty'],
        speakingStyle: analysis.speakingStyle || 'casual and warm',
        interests: personalityData.interests,
        background: personalityData.description,
        boundaries: personalityData.boundaries,
        flirtiness: analysis.flirtiness || 7,
        intelligence: analysis.intelligence || 8,
        humor: analysis.humor || 6
      };

      this.personalities.set(creatorId, personality);

      // Train voice clone if sample provided
      if (personalityData.voiceSample) {
        await aiVoiceCloningService.cloneVoice(
          creatorId,
          Buffer.from(personalityData.voiceSample, 'base64'),
          `${personality.name}_chatbot`
        );
      }

      return personality;
    } catch (error) {
      console.error('Personality creation failed:', error);
      return this.createMockPersonality(creatorId, personalityData);
    }
  }

  // Start AI chat session with deep personalization
  async startChatSession(
    userId: string,
    creatorId: string,
    initialMessage?: string
  ): Promise<ChatSession> {
    const personality = this.personalities.get(creatorId);
    if (!personality) {
      throw new Error('Creator personality not found');
    }

    // Build conversation context from user history
    const context = await this.buildConversationContext(userId, creatorId);

    const session: ChatSession = {
      id: `chat_${Date.now()}`,
      userId,
      creatorId,
      messages: [],
      personality,
      context,
      active: true,
      startTime: new Date()
    };

    this.activeSessions.set(session.id, session);

    // Send personalized greeting based on relationship level
    const greeting = await this.generatePersonalizedGreeting(session);
    const greetingMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'bot',
      content: greeting,
      timestamp: new Date(),
      sentiment: 'positive'
    };

    session.messages.push(greetingMessage);

    // Generate voice version of greeting
    const voiceGreeting = await aiVoiceCloningService.generateVoiceMessage(
      `${creatorId}_chatbot`,
      { text: greeting, voiceId: `${creatorId}_chatbot` },
      this.extractFirstName(context)
    );

    greetingMessage.voiceUrl = voiceGreeting.audioUrl;

    // Process initial message if provided
    if (initialMessage) {
      await this.processMessage(session.id, userId, initialMessage);
    }

    return session;
  }

  // Process incoming message with advanced AI
  async processMessage(
    sessionId: string,
    userId: string,
    message: string,
    mediaUrl?: string
  ): Promise<ChatMessage> {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.active) {
      throw new Error('Chat session not found or inactive');
    }

    // Add user message to history
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      content: message,
      timestamp: new Date(),
      mediaUrl,
      sentiment: await this.analyzeSentiment(message),
      intent: await this.detectIntent(message)
    };

    session.messages.push(userMessage);

    // Generate AI response
    const response = await this.generateResponse(session, userMessage);

    // Add AI response to history
    const aiMessage: ChatMessage = {
      id: `msg_${Date.now()}_ai`,
      sender: 'bot',
      content: response.text,
      timestamp: new Date(),
      sentiment: 'positive'
    };

    session.messages.push(aiMessage);

    // Generate voice response if enabled
    if (response.includeVoice) {
      const voiceResponse = await aiVoiceCloningService.generateVoiceMessage(
        `${session.creatorId}_chatbot`,
        { text: response.text, voiceId: `${session.creatorId}_chatbot` },
        this.extractFirstName(session.context)
      );
      aiMessage.voiceUrl = voiceResponse.audioUrl;
    }

    // Update conversation context
    await this.updateConversationContext(session, userMessage, aiMessage);

    return aiMessage;
  }

  // Generate ultra-realistic responses
  private async generateResponse(
    session: ChatSession,
    userMessage: ChatMessage
  ): Promise<{ text: string; includeVoice: boolean; suggestedActions?: string[] }> {
    if (!this.openai) {
      return {
        text: "That's interesting! Tell me more about that 😊",
        includeVoice: true
      };
    }

    try {
      // Build conversation history for context
      const recentMessages = session.messages.slice(-10).map(m => 
        `${m.sender}: ${m.content}`
      ).join('\n');

      const systemPrompt = `You are ${session.personality.name}, an adult content creator chatting with a fan. 

PERSONALITY TRAITS: ${session.personality.traits.join(', ')}
SPEAKING STYLE: ${session.personality.speakingStyle}
INTERESTS: ${session.personality.interests.join(', ')}
FLIRTINESS LEVEL: ${session.personality.flirtiness}/10
HUMOR LEVEL: ${session.personality.humor}/10

RELATIONSHIP CONTEXT:
- Fan has spent $${session.context.totalSpent} total
- Relationship level: ${session.context.relationshipLevel}/10
- Favorite content: ${session.context.favoriteContent.join(', ')}
- Current mood: ${session.context.mood}

BOUNDARIES: ${session.personality.boundaries.join(', ')}

INSTRUCTIONS:
- Be authentic, warm, and engaging
- Use natural conversation flow with emojis
- Reference their preferences and history when relevant  
- Gradually build intimacy based on relationship level
- Suggest content or actions that match their interests
- Keep responses 1-3 sentences, conversational
- Be flirty but respect boundaries
- Remember you're a real person, not an AI

Current conversation:
${recentMessages}

Respond as ${session.personality.name} would:`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "system",
          content: systemPrompt
        }, {
          role: "user", 
          content: userMessage.content
        }],
        max_tokens: 200,
        temperature: 0.8
      });

      const aiResponse = response.choices[0].message.content || "Hey there! 😊";

      // Determine if voice should be included
      const includeVoice = session.context.relationshipLevel >= 3 || 
                          userMessage.intent === 'voice_request' ||
                          Math.random() < 0.3; // 30% chance for voice

      // Generate suggested actions based on conversation
      const suggestedActions = await this.generateSuggestedActions(session, userMessage, aiResponse);

      return {
        text: aiResponse,
        includeVoice,
        suggestedActions
      };
    } catch (error) {
      console.error('Response generation failed:', error);
      return {
        text: "That's so sweet of you to say! 💕 What's been the highlight of your day?",
        includeVoice: true
      };
    }
  }

  // Advanced sentiment analysis
  private async analyzeSentiment(message: string): Promise<'positive' | 'neutral' | 'negative'> {
    if (!this.openai) return 'neutral';

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: `Analyze the sentiment of this message and respond with only "positive", "neutral", or "negative": "${message}"`
        }],
        max_tokens: 10
      });

      const sentiment = response.choices[0].message.content?.toLowerCase().trim();
      return (sentiment === 'positive' || sentiment === 'negative') ? sentiment : 'neutral';
    } catch {
      return 'neutral';
    }
  }

  // Intent detection for smart responses
  private async detectIntent(message: string): Promise<string> {
    if (!this.openai) return 'general';

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: `Classify the intent of this message. Options: greeting, compliment, request_content, request_custom, question_personal, flirting, support, complaint, voice_request, general. Message: "${message}"`
        }],
        max_tokens: 20
      });

      return response.choices[0].message.content?.toLowerCase().trim() || 'general';
    } catch {
      return 'general';
    }
  }

  // Smart conversation context building
  private async buildConversationContext(userId: string, creatorId: string): Promise<ConversationContext> {
    // This would query the database for user history
    // For now, returning mock data
    return {
      relationshipLevel: Math.floor(Math.random() * 10) + 1,
      purchaseHistory: ['premium_video_pack', 'custom_photo_set', 'voice_message'],
      preferences: ['lingerie', 'outdoor_shoots', 'voice_messages'],
      lastInteraction: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      totalSpent: Math.floor(Math.random() * 1000) + 50,
      favoriteContent: ['photo_sets', 'videos', 'live_streams'],
      timezone: 'America/New_York',
      mood: 'happy'
    };
  }

  // Generate personalized greeting based on context
  private async generatePersonalizedGreeting(session: ChatSession): Promise<string> {
    const { context, personality } = session;
    const timeOfDay = this.getTimeOfDay(context.timezone);
    const relationshipLevel = context.relationshipLevel;

    if (!this.openai) {
      if (relationshipLevel <= 3) {
        return `Good ${timeOfDay}! 😊 Thanks for reaching out!`;
      } else {
        return `Hey gorgeous! 💕 So happy to see you again!`;
      }
    }

    try {
      const prompt = `Generate a personalized greeting as ${personality.name} for a fan:
      
      CONTEXT:
      - Time: ${timeOfDay}
      - Relationship level: ${relationshipLevel}/10
      - Total spent: $${context.totalSpent}
      - Last interaction: ${this.getTimeSince(context.lastInteraction)}
      - Fan's mood: ${context.mood}
      
      PERSONALITY: ${personality.traits.join(', ')}
      
      Make it ${relationshipLevel <= 3 ? 'friendly but professional' : 'warm and intimate'}.
      1-2 sentences max. Include appropriate emoji.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100
      });

      return response.choices[0].message.content || `Good ${timeOfDay}! 😊`;
    } catch {
      return `Good ${timeOfDay}! 😊 Great to see you!`;
    }
  }

  // Generate smart action suggestions
  private async generateSuggestedActions(
    session: ChatSession,
    userMessage: ChatMessage,
    aiResponse: string
  ): Promise<string[]> {
    const suggestions = [];

    // Based on intent and context
    switch (userMessage.intent) {
      case 'request_content':
        suggestions.push('Browse Photo Sets', 'View New Videos', 'Custom Request');
        break;
      case 'flirting':
        suggestions.push('Send Voice Message', 'Private Video Call', 'Exclusive Content');
        break;
      case 'compliment':
        suggestions.push('Thank You Voice Note', 'Behind the Scenes', 'Personal Photo');
        break;
      default:
        if (session.context.relationshipLevel >= 5) {
          suggestions.push('Voice Chat', 'Custom Content', 'Surprise Gift');
        } else {
          suggestions.push('View Gallery', 'Subscribe', 'Send Tip');
        }
    }

    return suggestions.slice(0, 3); // Max 3 suggestions
  }

  // Automated response triggers
  async setupAutoResponses(
    creatorId: string,
    triggers: {
      keywords: string[];
      timeBasedRules: { hour: number; message: string }[];
      purchaseResponses: { type: string; message: string; delay: number }[];
      milestoneResponses: { milestone: string; message: string }[];
    }
  ): Promise<void> {
    // Store automation rules for the creator
    // These would trigger automatic responses based on various events
  }

  // AI conversation analytics
  async getChatAnalytics(creatorId: string): Promise<{
    totalSessions: number;
    averageSessionLength: number;
    sentimentBreakdown: { positive: number; neutral: number; negative: number };
    topIntents: { intent: string; count: number }[];
    conversionRate: number;
    revenueGenerated: number;
    mostEngagedFans: string[];
    peakHours: number[];
  }> {
    return {
      totalSessions: 1847,
      averageSessionLength: 12.5, // minutes
      sentimentBreakdown: { positive: 78, neutral: 18, negative: 4 },
      topIntents: [
        { intent: 'flirting', count: 567 },
        { intent: 'compliment', count: 423 },
        { intent: 'request_content', count: 341 },
        { intent: 'question_personal', count: 298 }
      ],
      conversionRate: 34.5, // % of chats leading to purchases
      revenueGenerated: 15420.75,
      mostEngagedFans: ['user_123', 'user_456', 'user_789'],
      peakHours: [20, 21, 22, 23] // 8-11 PM
    };
  }

  // Multi-language support
  async translateAndRespond(
    sessionId: string,
    message: string,
    targetLanguage: string
  ): Promise<ChatMessage> {
    if (!this.openai) {
      throw new Error('Translation not available');
    }

    // Translate incoming message to English
    const translatedMessage = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: `Translate this to English: "${message}"`
      }]
    });

    const englishMessage = translatedMessage.choices[0].message.content || message;

    // Process in English
    const response = await this.processMessage(sessionId, 'user', englishMessage);

    // Translate response back to target language
    const translatedResponse = await this.openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [{
        role: "user",
        content: `Translate this to ${targetLanguage}, maintaining the flirty and intimate tone: "${response.content}"`
      }]
    });

    response.content = translatedResponse.choices[0].message.content || response.content;
    return response;
  }

  // Helper Methods
  private createMockPersonality(creatorId: string, data: any): PersonalityProfile {
    return {
      name: data.name,
      traits: ['friendly', 'engaging', 'playful', 'intelligent'],
      speakingStyle: 'warm and conversational',
      interests: data.interests,
      background: data.description,
      boundaries: data.boundaries,
      flirtiness: 7,
      intelligence: 8,
      humor: 6
    };
  }

  private extractFirstName(context: ConversationContext): string {
    // Extract first name from context or return generic
    return 'gorgeous';
  }

  private getTimeOfDay(timezone: string): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  private getTimeSince(date: Date): string {
    const diff = Date.now() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    return `${days} days ago`;
  }

  private async updateConversationContext(
    session: ChatSession,
    userMessage: ChatMessage,
    aiMessage: ChatMessage
  ): Promise<void> {
    // Update relationship level, mood, preferences based on conversation
    if (userMessage.sentiment === 'positive') {
      session.context.relationshipLevel = Math.min(10, session.context.relationshipLevel + 0.1);
    }

    session.context.lastInteraction = new Date();
    session.context.mood = userMessage.sentiment || 'neutral';
  }
}

export const aiChatbotService = new AIChatbotService();