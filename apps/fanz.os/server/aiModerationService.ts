// AI-powered content moderation service
export interface ModerationResult {
  isApproved: boolean;
  confidence: number;
  flags: string[];
  category: 'safe' | 'review' | 'blocked';
  details: {
    toxicity: number;
    violence: number;
    harassment: number;
    sexualContent: number;
    spam: number;
  };
}

export interface ContentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
  language: string;
  readabilityScore: number;
  wordCount: number;
}

export class AIModerationService {
  private readonly thresholds = {
    toxicity: 0.7,
    violence: 0.8,
    harassment: 0.75,
    sexualContent: 0.6,
    spam: 0.8
  };

  // Main content moderation function
  async moderateContent(content: string, mediaUrls?: string[]): Promise<ModerationResult> {
    const textAnalysis = await this.analyzeText(content);
    let mediaAnalysis = null;
    
    if (mediaUrls && mediaUrls.length > 0) {
      mediaAnalysis = await this.analyzeMedia(mediaUrls);
    }

    return this.combineAnalysisResults(textAnalysis, mediaAnalysis);
  }

  // Text content analysis
  private async analyzeText(content: string): Promise<Partial<ModerationResult>> {
    // Simulate AI analysis - in production, this would call actual AI services
    const analysis = {
      toxicity: this.calculateToxicityScore(content),
      violence: this.calculateViolenceScore(content),
      harassment: this.calculateHarassmentScore(content),
      sexualContent: this.calculateSexualContentScore(content),
      spam: this.calculateSpamScore(content)
    };

    const flags: string[] = [];
    let maxScore = 0;

    Object.entries(analysis).forEach(([key, score]) => {
      if (score > this.thresholds[key as keyof typeof this.thresholds]) {
        flags.push(key);
        maxScore = Math.max(maxScore, score);
      }
    });

    const isApproved = flags.length === 0;
    const category = this.determineCategory(flags, maxScore);

    return {
      isApproved,
      confidence: Math.max(...Object.values(analysis)),
      flags,
      category,
      details: analysis
    };
  }

  // Media content analysis
  private async analyzeMedia(mediaUrls: string[]): Promise<Partial<ModerationResult>> {
    // Simulate media analysis - in production, this would use Google Vision API, AWS Rekognition, etc.
    const mediaFlags: string[] = [];
    
    for (const url of mediaUrls) {
      const mediaType = this.detectMediaType(url);
      
      if (mediaType === 'image') {
        const imageAnalysis = await this.analyzeImage(url);
        mediaFlags.push(...imageAnalysis.flags);
      } else if (mediaType === 'video') {
        const videoAnalysis = await this.analyzeVideo(url);
        mediaFlags.push(...videoAnalysis.flags);
      }
    }

    return {
      flags: mediaFlags,
      isApproved: mediaFlags.length === 0,
      confidence: 0.8 // Default confidence for media analysis
    };
  }

  // Image analysis simulation
  private async analyzeImage(imageUrl: string): Promise<{ flags: string[] }> {
    // In production, this would call image recognition APIs
    console.log(`Analyzing image: ${imageUrl}`);
    
    // Simulate various checks
    const flags: string[] = [];
    
    // Simulate unsafe content detection
    if (Math.random() < 0.05) flags.push('inappropriate_content');
    if (Math.random() < 0.02) flags.push('violence');
    if (Math.random() < 0.03) flags.push('illegal_content');
    
    return { flags };
  }

  // Video analysis simulation
  private async analyzeVideo(videoUrl: string): Promise<{ flags: string[] }> {
    console.log(`Analyzing video: ${videoUrl}`);
    
    const flags: string[] = [];
    
    // Simulate video content analysis
    if (Math.random() < 0.04) flags.push('inappropriate_content');
    if (Math.random() < 0.01) flags.push('violence');
    if (Math.random() < 0.02) flags.push('copyright_violation');
    
    return { flags };
  }

  // Combine text and media analysis results
  private combineAnalysisResults(
    textAnalysis: Partial<ModerationResult>, 
    mediaAnalysis: Partial<ModerationResult> | null
  ): ModerationResult {
    const combinedFlags = [
      ...(textAnalysis.flags || []),
      ...(mediaAnalysis?.flags || [])
    ];

    const isApproved = combinedFlags.length === 0;
    const confidence = Math.max(
      textAnalysis.confidence || 0,
      mediaAnalysis?.confidence || 0
    );

    return {
      isApproved,
      confidence,
      flags: [...new Set(combinedFlags)], // Remove duplicates
      category: this.determineCategory(combinedFlags, confidence),
      details: textAnalysis.details || {
        toxicity: 0,
        violence: 0,
        harassment: 0,
        sexualContent: 0,
        spam: 0
      }
    };
  }

  // Content analysis helpers
  private calculateToxicityScore(content: string): number {
    const toxicKeywords = [
      'hate', 'stupid', 'idiot', 'moron', 'loser', 'pathetic', 'disgusting',
      'worthless', 'failure', 'trash', 'garbage', 'scum'
    ];
    
    const words = content.toLowerCase().split(/\s+/);
    const toxicCount = words.filter(word => 
      toxicKeywords.some(keyword => word.includes(keyword))
    ).length;
    
    return Math.min(toxicCount / words.length * 5, 1);
  }

  private calculateViolenceScore(content: string): number {
    const violentKeywords = [
      'kill', 'murder', 'attack', 'hurt', 'violence', 'weapon', 'gun',
      'knife', 'bomb', 'terrorist', 'threat', 'destroy', 'harm'
    ];
    
    const words = content.toLowerCase().split(/\s+/);
    const violentCount = words.filter(word => 
      violentKeywords.some(keyword => word.includes(keyword))
    ).length;
    
    return Math.min(violentCount / words.length * 10, 1);
  }

  private calculateHarassmentScore(content: string): number {
    const harassmentPatterns = [
      /you (are|should|will|deserve)/i,
      /go (die|away|fuck)/i,
      /nobody (likes|wants|cares)/i,
      /\b(stalker|creep|pervert)\b/i
    ];
    
    const matchCount = harassmentPatterns.filter(pattern => 
      pattern.test(content)
    ).length;
    
    return Math.min(matchCount * 0.3, 1);
  }

  private calculateSexualContentScore(content: string): number {
    // Note: This is a simplified example for adult content platform
    // Real implementation would be more sophisticated and context-aware
    const explicitKeywords = [
      // Add appropriate keywords based on platform policies
    ];
    
    const words = content.toLowerCase().split(/\s+/);
    const explicitCount = words.filter(word => 
      explicitKeywords.some(keyword => word.includes(keyword))
    ).length;
    
    // For adult platform, this might be more permissive
    return Math.min(explicitCount / words.length * 3, 1);
  }

  private calculateSpamScore(content: string): number {
    let spamScore = 0;
    
    // Check for repetitive content
    const words = content.split(/\s+/);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const repetitionRatio = 1 - (uniqueWords.size / words.length);
    spamScore += repetitionRatio * 0.5;
    
    // Check for excessive links
    const linkCount = (content.match(/https?:\/\//g) || []).length;
    if (linkCount > 3) spamScore += 0.3;
    
    // Check for excessive emojis
    const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu) || []).length;
    const emojiRatio = emojiCount / content.length;
    if (emojiRatio > 0.1) spamScore += 0.2;
    
    return Math.min(spamScore, 1);
  }

  private determineCategory(flags: string[], confidence: number): 'safe' | 'review' | 'blocked' {
    if (flags.length === 0) return 'safe';
    
    const criticalFlags = ['violence', 'illegal_content', 'harassment'];
    const hasCriticalFlag = flags.some(flag => criticalFlags.includes(flag));
    
    if (hasCriticalFlag || confidence > 0.9) return 'blocked';
    if (confidence > 0.5) return 'review';
    
    return 'safe';
  }

  private detectMediaType(url: string): 'image' | 'video' | 'audio' | 'unknown' {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
    if (['mp4', 'webm', 'mov', 'avi'].includes(extension || '')) return 'video';
    if (['mp3', 'wav', 'aac', 'ogg'].includes(extension || '')) return 'audio';
    
    return 'unknown';
  }

  // Content analysis for business intelligence
  async analyzeContentTrends(content: string): Promise<ContentAnalysis> {
    // Simulate content analysis for trends and insights
    return {
      sentiment: this.analyzeSentiment(content),
      topics: this.extractTopics(content),
      language: this.detectLanguage(content),
      readabilityScore: this.calculateReadability(content),
      wordCount: content.split(/\s+/).length
    };
  }

  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['great', 'amazing', 'love', 'awesome', 'fantastic', 'excellent', 'wonderful'];
    const negativeWords = ['terrible', 'awful', 'hate', 'horrible', 'disgusting', 'bad', 'worst'];
    
    const words = content.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractTopics(content: string): string[] {
    // Simplified topic extraction
    const commonTopics = [
      'fitness', 'beauty', 'lifestyle', 'gaming', 'music', 'art', 'food',
      'travel', 'fashion', 'technology', 'education', 'entertainment'
    ];
    
    const words = content.toLowerCase();
    return commonTopics.filter(topic => words.includes(topic));
  }

  private detectLanguage(content: string): string {
    // Simplified language detection
    const commonWords = {
      en: ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with'],
      es: ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no'],
      fr: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir'],
      de: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich']
    };
    
    const words = content.toLowerCase().split(/\s+/);
    const scores = Object.entries(commonWords).map(([lang, langWords]) => {
      const matches = words.filter(word => langWords.includes(word)).length;
      return { lang, score: matches / words.length };
    });
    
    const bestMatch = scores.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    
    return bestMatch.score > 0.1 ? bestMatch.lang : 'unknown';
  }

  private calculateReadability(content: string): number {
    // Simplified readability score (0-100, higher is easier to read)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/);
    const syllables = words.reduce((total, word) => total + this.countSyllables(word), 0);
    
    if (sentences.length === 0) return 0;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    // Simplified Flesch Reading Ease formula
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    
    return Math.max(0, Math.min(100, score));
  }

  private countSyllables(word: string): number {
    // Simplified syllable counting
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;
    
    for (const char of word.toLowerCase()) {
      const isVowel = vowels.includes(char);
      if (isVowel && !previousWasVowel) count++;
      previousWasVowel = isVowel;
    }
    
    return Math.max(1, count);
  }

  // Automated moderation actions
  async getRecommendedAction(moderationResult: ModerationResult): Promise<{
    action: 'approve' | 'flag_for_review' | 'auto_reject' | 'require_editing';
    reason: string;
    suggestions?: string[];
  }> {
    if (moderationResult.category === 'blocked') {
      return {
        action: 'auto_reject',
        reason: `Content blocked due to: ${moderationResult.flags.join(', ')}`,
        suggestions: [
          'Remove inappropriate language',
          'Revise content to follow community guidelines',
          'Contact support if you believe this is an error'
        ]
      };
    }
    
    if (moderationResult.category === 'review') {
      return {
        action: 'flag_for_review',
        reason: `Content flagged for manual review: ${moderationResult.flags.join(', ')}`
      };
    }
    
    if (moderationResult.confidence < 0.8 && moderationResult.flags.length > 0) {
      return {
        action: 'require_editing',
        reason: 'Content may need minor adjustments',
        suggestions: [
          'Consider rephrasing some sections',
          'Review for clarity and appropriateness'
        ]
      };
    }
    
    return {
      action: 'approve',
      reason: 'Content meets community guidelines'
    };
  }
}

export const aiModerationService = new AIModerationService();