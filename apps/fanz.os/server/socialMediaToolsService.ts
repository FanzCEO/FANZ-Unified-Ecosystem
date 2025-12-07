import { z } from "zod";

export interface HashtagSuggestion {
  tag: string;
  popularity: 'low' | 'medium' | 'high' | 'trending';
  posts: number;
  engagement?: number;
}

export interface PostSuggestion {
  content: string;
  platform: string;
  tone: string;
  hashtags?: string[];
  characterCount: number;
}

export interface AIGeneratedContent {
  posts: PostSuggestion[];
  hashtags?: HashtagSuggestion[];
}

export class SocialMediaToolsService {
  private hashtagDatabase: Record<string, HashtagSuggestion[]> = {
    fitness: [
      { tag: '#fitness', popularity: 'high', posts: 200000000 },
      { tag: '#workout', popularity: 'high', posts: 150000000 },
      { tag: '#gym', popularity: 'high', posts: 120000000 },
      { tag: '#fitnessmotivation', popularity: 'medium', posts: 80000000 },
      { tag: '#healthylifestyle', popularity: 'medium', posts: 75000000 },
      { tag: '#bodybuilding', popularity: 'medium', posts: 45000000 },
      { tag: '#cardio', popularity: 'medium', posts: 35000000 },
      { tag: '#strength', popularity: 'low', posts: 25000000 },
      { tag: '#fitfam', popularity: 'medium', posts: 40000000 },
      { tag: '#gains', popularity: 'medium', posts: 30000000 }
    ],
    beauty: [
      { tag: '#beauty', popularity: 'high', posts: 300000000 },
      { tag: '#makeup', popularity: 'high', posts: 250000000 },
      { tag: '#skincare', popularity: 'high', posts: 180000000 },
      { tag: '#cosmetics', popularity: 'medium', posts: 90000000 },
      { tag: '#beautytips', popularity: 'medium', posts: 70000000 },
      { tag: '#makeupartist', popularity: 'medium', posts: 65000000 },
      { tag: '#selfcare', popularity: 'medium', posts: 85000000 },
      { tag: '#glam', popularity: 'medium', posts: 55000000 },
      { tag: '#beautyguru', popularity: 'low', posts: 20000000 },
      { tag: '#makeuplover', popularity: 'medium', posts: 45000000 }
    ],
    lifestyle: [
      { tag: '#lifestyle', popularity: 'high', posts: 400000000 },
      { tag: '#dailylife', popularity: 'medium', posts: 80000000 },
      { tag: '#vibes', popularity: 'high', posts: 120000000 },
      { tag: '#mood', popularity: 'high', posts: 150000000 },
      { tag: '#aesthetic', popularity: 'high', posts: 100000000 },
      { tag: '#selfie', popularity: 'high', posts: 500000000 },
      { tag: '#outfitoftheday', popularity: 'high', posts: 200000000 },
      { tag: '#style', popularity: 'high', posts: 180000000 },
      { tag: '#fashion', popularity: 'high', posts: 300000000 },
      { tag: '#ootd', popularity: 'high', posts: 150000000 }
    ]
  };

  private postTemplates: Record<string, Record<string, string[]>> = {
    instagram: {
      casual: [
        "Just had the most amazing {topic} session! 💪 Who else is crushing their goals today?",
        "Sunday vibes with some {topic} time ✨ What's everyone up to?",
        "Currently obsessing over {topic} - anyone else feeling this energy?",
        "That feeling when {topic} just hits different today 🔥",
        "Sharing some {topic} love because why not? Hope your day is as good as mine!"
      ],
      flirty: [
        "Feeling myself after this {topic} session 😏 What do you think?",
        "Just me and my {topic} vibes... care to join? 💋",
        "When {topic} makes you feel this confident 🔥 DM me your thoughts",
        "Serving some serious {topic} energy today... you like what you see?",
        "Just finished {topic} and feeling unstoppable 💅 What's your weakness?"
      ],
      professional: [
        "Dedicated to excellence in {topic}. Consistency is key to achieving your goals.",
        "Today's {topic} session: pushing boundaries and setting new standards.",
        "Professional insight: {topic} requires dedication, discipline, and passion.",
        "Elevating my {topic} game every single day. What drives your success?",
        "Quality over quantity - that's my approach to {topic}."
      ]
    },
    tiktok: {
      casual: [
        "POV: You just discovered the best {topic} hack 🤯",
        "Tell me you love {topic} without telling me... I'll go first:",
        "That {topic} energy hit different today ✨ #fyp",
        "When someone asks about my {topic} routine:",
        "Me explaining why {topic} is actually the best:"
      ],
      flirty: [
        "POV: You catch me doing {topic} 👀",
        "When he asks what I'm good at... {topic} enters the chat 😏",
        "Rating {topic} outfits until I find the perfect one",
        "That look when {topic} makes you feel unstoppable 🔥",
        "Comment if you want to join my {topic} session 💋"
      ]
    }
  };

  async generateSocialMediaPost(data: {
    topic: string;
    platform: string;
    tone: string;
  }): Promise<AIGeneratedContent> {
    const { topic, platform, tone } = data;
    
    // Get relevant templates
    const templates = this.postTemplates[platform]?.[tone] || this.postTemplates.instagram.casual;
    
    // Generate multiple post variations
    const posts: PostSuggestion[] = templates.slice(0, 3).map(template => {
      const content = template.replace(/{topic}/g, topic);
      const hashtags = this.generateRelevantHashtags(topic, platform);
      
      return {
        content: content + '\n\n' + hashtags.slice(0, 5).map(h => h.tag).join(' '),
        platform,
        tone,
        hashtags: hashtags.slice(0, 5).map(h => h.tag),
        characterCount: content.length
      };
    });

    return { posts };
  }

  async generateHashtags(data: {
    keyword: string;
    platform: string;
  }): Promise<{ hashtags: HashtagSuggestion[] }> {
    const { keyword, platform } = data;
    
    // Generate hashtags based on keyword
    const hashtags = this.generateRelevantHashtags(keyword, platform);
    
    return { hashtags };
  }

  private generateRelevantHashtags(keyword: string, platform: string): HashtagSuggestion[] {
    const normalizedKeyword = keyword.toLowerCase();
    
    // Check if keyword matches any category
    let baseHashtags: HashtagSuggestion[] = [];
    
    if (normalizedKeyword.includes('fit') || normalizedKeyword.includes('workout') || normalizedKeyword.includes('gym')) {
      baseHashtags = this.hashtagDatabase.fitness;
    } else if (normalizedKeyword.includes('beauty') || normalizedKeyword.includes('makeup') || normalizedKeyword.includes('skin')) {
      baseHashtags = this.hashtagDatabase.beauty;
    } else {
      baseHashtags = this.hashtagDatabase.lifestyle;
    }

    // Add keyword-specific hashtags
    const keywordHashtags: HashtagSuggestion[] = [
      { tag: `#${normalizedKeyword.replace(/\s+/g, '')}`, popularity: 'medium', posts: 1000000 },
      { tag: `#${normalizedKeyword.replace(/\s+/g, '')}life`, popularity: 'low', posts: 500000 },
      { tag: `#${normalizedKeyword.replace(/\s+/g, '')}vibes`, popularity: 'medium', posts: 800000 },
      { tag: `#${normalizedKeyword.replace(/\s+/g, '')}love`, popularity: 'medium', posts: 750000 }
    ];

    // Combine and shuffle
    const allHashtags = [...baseHashtags, ...keywordHashtags];
    
    // Platform-specific limits and adjustments
    const platformLimits = {
      instagram: 30,
      tiktok: 20,
      youtube: 15,
      twitter: 10
    };

    const limit = platformLimits[platform as keyof typeof platformLimits] || 15;
    
    return allHashtags
      .sort(() => Math.random() - 0.5) // Shuffle
      .slice(0, limit)
      .sort((a, b) => {
        // Sort by popularity
        const popularityOrder = { trending: 4, high: 3, medium: 2, low: 1 };
        return popularityOrder[b.popularity] - popularityOrder[a.popularity];
      });
  }

  // Generate platform-optimized content
  generatePlatformOptimizedContent(content: string, platform: string): string {
    switch (platform) {
      case 'twitter':
        return content.length > 280 ? content.substring(0, 270) + '...' : content;
      case 'instagram':
        return content + '\n\n#instagramreels #explore #viral';
      case 'tiktok':
        return content + '\n\n#fyp #foryou #viral #trending';
      case 'youtube':
        return content + '\n\n#shorts #youtube #subscribe';
      default:
        return content;
    }
  }

  // Validate UTM parameters
  validateUTMParams(params: {
    url: string;
    source: string;
    medium: string;
    campaign: string;
    term?: string;
    content?: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      new URL(params.url);
    } catch {
      errors.push('Invalid URL format');
    }

    if (!params.source.trim()) errors.push('Source is required');
    if (!params.medium.trim()) errors.push('Medium is required');
    if (!params.campaign.trim()) errors.push('Campaign is required');

    // Check for invalid characters
    const invalidChars = /[<>'"]/;
    if (invalidChars.test(params.source)) errors.push('Source contains invalid characters');
    if (invalidChars.test(params.medium)) errors.push('Medium contains invalid characters');
    if (invalidChars.test(params.campaign)) errors.push('Campaign contains invalid characters');

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const socialMediaToolsService = new SocialMediaToolsService();