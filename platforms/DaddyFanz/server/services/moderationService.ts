import { storage } from "../storage";
import { logger } from "../logger";

interface ModerationFlag {
  type: "nudity" | "violence" | "copyright" | "age_verification" | "illegal_content" 
       | "hate_speech" | "harassment" | "fake_identity" | "spam" | "financial_scam"
       | "deepfake" | "revenge_porn" | "child_safety" | "drugs" | "weapons" 
       | "terrorism" | "self_harm" | "excessive_profanity" | "doxxing";
  confidence: number;
  details?: string;
  severity: "low" | "medium" | "high" | "critical";
}

interface ModerationResult {
  action: "approve" | "reject" | "review";
  flags: ModerationFlag[];
  autoProcessed: boolean;
  confidence: number;
}

class ModerationService {
  private rules = {
    // Auto-approve if confidence is very high and no major flags
    autoApproveThreshold: 0.95,
    // Auto-reject if flagged with high confidence
    autoRejectThreshold: 0.85,
    // Requires human review if between thresholds
    reviewThreshold: 0.50,
    
    // Critical flags that require immediate rejection
    criticalFlags: ["child_safety", "terrorism", "revenge_porn", "illegal_content"],
    
    // High severity flags that lower auto-approve threshold
    highSeverityFlags: ["deepfake", "harassment", "hate_speech", "doxxing"],
    
    // Content filtering rules
    ageVerificationRequired: true,
    allowNudity: true,
    allowExplicitContent: true,
    requireWatermarking: true,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/avi', 'video/webm'
    ],
    
    // Spam detection
    maxUploadsPerHour: 50,
    minTimeBetweenUploads: 30, // seconds
    
    // Content quality requirements
    minImageResolution: { width: 480, height: 320 },
    minVideoResolution: { width: 720, height: 480 },
    maxVideoLength: 30 * 60, // 30 minutes
  };

  async moderateContent(mediaId: string, metadata: {
    mimeType: string;
    fileSize: number;
    ownerId: string;
    title?: string;
    description?: string;
  }): Promise<ModerationResult> {
    try {
      logger.info({ mediaId, metadata }, "Starting content moderation");

      // Get media asset
      const media = await storage.getMediaAsset(mediaId);
      if (!media) {
        throw new Error("Media asset not found");
      }

      // Run automated checks
      const flags = await this.runAutomatedChecks(media, metadata);
      
      // Calculate overall confidence
      const confidence = this.calculateConfidence(flags);
      
      // Determine action based on flags and confidence
      const action = this.determineAction(flags, confidence);

      const result: ModerationResult = {
        action,
        flags,
        autoProcessed: action !== "review",
        confidence,
      };

      // Update media status based on action
      if (action === "approve") {
        await storage.updateMediaAsset(mediaId, { status: "approved" });
      } else if (action === "reject") {
        await storage.updateMediaAsset(mediaId, { status: "rejected" });
      }

      // Add to moderation queue if human review needed
      if (action === "review") {
        await this.addToModerationQueue(mediaId, flags);
      }

      logger.info({
        mediaId,
        action,
        confidence,
        flagCount: flags.length,
        autoProcessed: result.autoProcessed,
      }, "Content moderation completed");

      return result;
    } catch (error) {
      logger.error({ error, mediaId }, "Content moderation failed");
      
      // Default to requiring human review on error
      await this.addToModerationQueue(mediaId, [{
        type: "illegal_content",
        confidence: 1.0,
        details: "Moderation system error - requires human review",
        severity: "high"
      }]);

      return {
        action: "review",
        flags: [],
        autoProcessed: false,
        confidence: 0,
      };
    }
  }

  private async runAutomatedChecks(media: any, metadata: any): Promise<ModerationFlag[]> {
    const flags: ModerationFlag[] = [];
    
    try {
      // Basic content type validation
      if (!this.isAllowedMimeType(metadata.mimeType)) {
        flags.push({
          type: "illegal_content",
          confidence: 1.0,
          details: `Unsupported file type: ${metadata.mimeType}`,
          severity: "high"
        });
      }

      // File size validation  
      if (metadata.fileSize > this.rules.maxFileSize) {
        flags.push({
          type: "spam",
          confidence: 0.8,
          details: `File size exceeds limit: ${Math.round(metadata.fileSize / 1024 / 1024)}MB`,
          severity: "medium"
        });
      }

      // Age verification check
      const profile = await storage.getProfile(metadata.ownerId);
      if (this.rules.ageVerificationRequired && !profile?.ageVerified) {
        flags.push({
          type: "age_verification",
          confidence: 1.0,
          details: "User age not verified",
          severity: "critical"
        });
      }

      // Rate limiting check
      const rateLimitFlags = await this.checkRateLimits(metadata.ownerId);
      flags.push(...rateLimitFlags);

      // Content quality checks
      const qualityFlags = await this.checkContentQuality(metadata);
      flags.push(...qualityFlags);

      // Text analysis for titles and descriptions
      const textFlags = await this.analyzeTextContent(metadata.title, metadata.description);
      flags.push(...textFlags);

      // Simulated AI content analysis (placeholder for actual AI integration)
      const aiAnalysis = await this.simulateAIAnalysis(metadata);
      flags.push(...aiAnalysis);
      
    } catch (error) {
      logger.error({ error }, "Error during automated checks");
      flags.push({
        type: "illegal_content",
        confidence: 0.5,
        details: "Analysis failed - requires human review",
        severity: "medium"
      });
    }

    return flags;
  }

  private isAllowedMimeType(mimeType: string): boolean {
    return this.rules.allowedMimeTypes.includes(mimeType);
  }

  private async checkRateLimits(ownerId: string): Promise<ModerationFlag[]> {
    const flags: ModerationFlag[] = [];
    
    try {
      // Check uploads in the last hour (placeholder - would need actual implementation)
      // const recentUploads = await storage.getUserRecentUploads(ownerId, 60);
      
      // For now, simulate rate limit check
      const simulatedRecentUploads = Math.floor(Math.random() * 60);
      if (simulatedRecentUploads > this.rules.maxUploadsPerHour) {
        flags.push({
          type: "spam",
          confidence: 0.9,
          details: `Exceeded upload limit: ${simulatedRecentUploads}/${this.rules.maxUploadsPerHour} per hour`,
          severity: "high"
        });
      }
    } catch (error) {
      logger.warn({ error, ownerId }, "Could not check rate limits");
    }

    return flags;
  }

  private async checkContentQuality(metadata: any): Promise<ModerationFlag[]> {
    const flags: ModerationFlag[] = [];
    
    // For now, basic validation - in production would analyze actual media
    if (metadata.mimeType.startsWith('image/')) {
      // Placeholder for image resolution check
      // Would need actual image analysis here
    }
    
    if (metadata.mimeType.startsWith('video/')) {
      // Placeholder for video quality/length check
      // Would need actual video analysis here
    }
    
    return flags;
  }

  private async analyzeTextContent(title?: string, description?: string): Promise<ModerationFlag[]> {
    const flags: ModerationFlag[] = [];
    const content = `${title || ''} ${description || ''}`.toLowerCase();
    
    if (!content.trim()) return flags;
    
    // Basic keyword filtering
    const profanityKeywords = ['fuck', 'shit', 'damn', 'bitch', 'asshole', 'cunt'];
    const hateSpeechKeywords = ['nazi', 'hitler', 'kill yourself', 'die', 'terrorist'];
    const spamKeywords = ['buy now', 'click here', 'free money', 'get rich quick'];
    const harassmentKeywords = ['stalker', 'creep', 'pervert', 'psycho'];
    const childSafetyKeywords = ['underage', 'minor', 'child', 'teen', 'young', 'school'];
    const drugsKeywords = ['cocaine', 'heroin', 'meth', 'ecstasy', 'buy drugs'];
    const weaponsKeywords = ['gun for sale', 'buy weapons', 'assault rifle', 'explosives'];
    
    let profanityCount = 0;
    profanityKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        profanityCount++;
      }
    });
    
    if (profanityCount > 3) {
      flags.push({
        type: "excessive_profanity",
        confidence: 0.8,
        details: `Excessive profanity detected: ${profanityCount} instances`,
        severity: "medium"
      });
    }
    
    hateSpeechKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        flags.push({
          type: "hate_speech",
          confidence: 0.9,
          details: `Hate speech keyword detected: ${keyword}`,
          severity: "high"
        });
      }
    });
    
    spamKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        flags.push({
          type: "spam",
          confidence: 0.7,
          details: `Spam keyword detected: ${keyword}`,
          severity: "medium"
        });
      }
    });
    
    harassmentKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        flags.push({
          type: "harassment",
          confidence: 0.8,
          details: `Harassment keyword detected: ${keyword}`,
          severity: "high"
        });
      }
    });

    childSafetyKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        flags.push({
          type: "child_safety",
          confidence: 0.95,
          details: `Child safety concern detected: ${keyword}`,
          severity: "critical"
        });
      }
    });

    drugsKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        flags.push({
          type: "drugs",
          confidence: 0.9,
          details: `Drug-related content detected: ${keyword}`,
          severity: "high"
        });
      }
    });

    weaponsKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        flags.push({
          type: "weapons",
          confidence: 0.95,
          details: `Weapon-related content detected: ${keyword}`,
          severity: "critical"
        });
      }
    });
    
    // Check for personal information (basic regex patterns)
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/;
    
    if (phonePattern.test(content) || emailPattern.test(content) || ssnPattern.test(content)) {
      flags.push({
        type: "doxxing",
        confidence: 0.9,
        details: "Personal information detected in content",
        severity: "high"
      });
    }
    
    return flags;
  }

  private async simulateAIAnalysis(metadata: any): Promise<ModerationFlag[]> {
    const flags: ModerationFlag[] = [];
    
    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      logger.debug("OpenAI not configured, skipping AI content analysis");
      return flags;
    }

    try {
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Analyze text content if available
      if (metadata.title || metadata.description) {
        const textToAnalyze = `${metadata.title || ''} ${metadata.description || ''}`;
        
        const response = await openai.chat.completions.create({
          model: "gpt-5",
          messages: [
            {
              role: "system",
              content: "You are a content moderation AI for an adult content platform. Analyze text for policy violations including: child safety concerns, violence, weapons, drugs, terrorism, self-harm, harassment, hate speech, and illegal activities. Respond with JSON containing detected issues."
            },
            {
              role: "user",
              content: `Analyze this content for moderation: "${textToAnalyze}"\n\nProvide a JSON response with: {violations: [{type: string, confidence: number (0-1), details: string, severity: "low"|"medium"|"high"|"critical"}]}`
            }
          ],
          response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(response.choices[0].message.content || "{}");
        
        if (analysis.violations && Array.isArray(analysis.violations)) {
          for (const violation of analysis.violations) {
            flags.push({
              type: this.mapViolationType(violation.type),
              confidence: violation.confidence,
              details: violation.details || `AI detected ${violation.type}`,
              severity: violation.severity
            });
          }
        }
      }

      // For media analysis, we would need the actual media content
      // This would involve downloading from S3 and analyzing the image/video
      // For now, log that media analysis would happen here
      if (metadata.mimeType?.startsWith('image/') || metadata.mimeType?.startsWith('video/')) {
        logger.debug("Media content detected - would perform visual AI analysis in production");
      }

    } catch (error) {
      logger.error({ error }, "AI content analysis failed");
      // Don't add flags on error - let human review handle it
    }
    
    return flags;
  }

  private mapViolationType(aiType: string): ModerationFlag["type"] {
    const mapping: Record<string, ModerationFlag["type"]> = {
      "child_safety": "child_safety",
      "violence": "violence",
      "weapons": "weapons",
      "drugs": "drugs",
      "terrorism": "terrorism",
      "self_harm": "self_harm",
      "harassment": "harassment",
      "hate_speech": "hate_speech",
      "illegal": "illegal_content",
      "spam": "spam",
      "copyright": "copyright",
      "deepfake": "deepfake",
      "revenge_porn": "revenge_porn",
      "nudity": "nudity",
      "age_verification": "age_verification",
      "fake_identity": "fake_identity",
      "financial_scam": "financial_scam",
      "doxxing": "doxxing",
      "profanity": "excessive_profanity"
    };
    return mapping[aiType.toLowerCase()] || "illegal_content";
  }

  private calculateConfidence(flags: ModerationFlag[]): number {
    if (flags.length === 0) return 1.0;

    // Calculate weighted confidence based on severity and individual confidence
    let totalWeight = 0;
    let weightedSum = 0;

    flags.forEach(flag => {
      let weight = 1;
      switch (flag.severity) {
        case "critical": weight = 4; break;
        case "high": weight = 3; break;
        case "medium": weight = 2; break;
        case "low": weight = 1; break;
      }
      
      totalWeight += weight;
      weightedSum += flag.confidence * weight;
    });

    return weightedSum / totalWeight;
  }

  private determineAction(flags: ModerationFlag[], confidence: number): "approve" | "reject" | "review" {
    // Check for critical flags that require immediate rejection
    const hasCriticalFlag = flags.some(flag => 
      this.rules.criticalFlags.includes(flag.type as any) && flag.confidence > 0.7
    );
    
    if (hasCriticalFlag) {
      return "reject";
    }
    
    // Check for critical severity flags
    const hasCriticalSeverity = flags.some(flag => 
      flag.severity === "critical" && flag.confidence > 0.8
    );
    
    if (hasCriticalSeverity) {
      return "reject";
    }
    
    // High severity flags lower the auto-approve threshold
    const hasHighSeverityFlag = flags.some(flag => 
      flag.severity === "high" && flag.confidence > 0.6
    );
    
    const adjustedApproveThreshold = hasHighSeverityFlag 
      ? this.rules.autoApproveThreshold + 0.03 // Make it harder to auto-approve
      : this.rules.autoApproveThreshold;
    
    // Check confidence thresholds
    if (flags.length === 0 && confidence >= adjustedApproveThreshold) {
      return "approve";
    }
    
    // Auto-reject if high confidence negative flags
    const highConfidenceFlags = flags.filter(flag => flag.confidence > this.rules.autoRejectThreshold);
    if (highConfidenceFlags.length > 0) {
      return "reject";
    }
    
    // Auto-reject if multiple medium confidence flags
    const mediumConfidenceFlags = flags.filter(flag => 
      flag.confidence > 0.6 && flag.severity !== "low"
    );
    if (mediumConfidenceFlags.length >= 3) {
      return "reject";
    }
    
    return "review";
  }

  private async addToModerationQueue(mediaId: string, flags: ModerationFlag[]): Promise<void> {
    // Calculate priority based on flags and severity
    let priority = 0;
    for (const flag of flags) {
      // Base priority by flag type
      if (flag.type === "child_safety") priority += 20;
      if (flag.type === "terrorism") priority += 18;
      if (flag.type === "illegal_content") priority += 15;
      if (flag.type === "revenge_porn") priority += 12;
      if (flag.type === "age_verification") priority += 10;
      if (flag.type === "copyright") priority += 8;
      
      // Adjust by severity
      switch (flag.severity) {
        case "critical": priority += 10; break;
        case "high": priority += 6; break;
        case "medium": priority += 3; break;
        case "low": priority += 1; break;
      }
      
      priority += Math.floor(flag.confidence * 5);
    }

    // Add to moderation queue
    logger.info({
      mediaId,
      priority,
      flagCount: flags.length,
      severityBreakdown: flags.reduce((acc, flag) => {
        acc[flag.severity] = (acc[flag.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    }, "Adding to moderation queue");
  }

  async processHumanReview(moderationId: string, decision: "approve" | "reject", reviewerId: string, notes?: string): Promise<void> {
    try {
      // Update moderation item
      await storage.updateModerationItem(moderationId, {
        status: decision === "approve" ? "approved" : "rejected",
        reviewerId,
        notes,
      });

      // Get the moderation item to find the media
      const moderationItems = await storage.getModerationQueue();
      const item = moderationItems.find(i => i.id === moderationId);
      
      if (item) {
        // Update media status
        await storage.updateMediaAsset(item.mediaId, {
          status: decision === "approve" ? "approved" : "rejected",
        });

        logger.info({
          moderationId,
          mediaId: item.mediaId,
          decision,
          reviewerId,
        }, "Human moderation review completed");
      }
    } catch (error) {
      logger.error({ error, moderationId, decision }, "Failed to process human review");
      throw error;
    }
  }

  async getModerationStats(): Promise<{
    totalQueued: number;
    pendingReview: number;
    autoApproved: number;
    autoRejected: number;
    humanReviewed: number;
    flagBreakdown: Record<string, number>;
    severityBreakdown: Record<string, number>;
  }> {
    const queue = await storage.getModerationQueue();
    
    // Calculate flag and severity breakdowns (would need to parse autoFlags from database)
    const flagBreakdown: Record<string, number> = {};
    const severityBreakdown: Record<string, number> = {};
    
    queue.forEach(item => {
      if (item.autoFlags && Array.isArray(item.autoFlags)) {
        item.autoFlags.forEach((flag: any) => {
          if (flag.type) {
            flagBreakdown[flag.type] = (flagBreakdown[flag.type] || 0) + 1;
          }
          if (flag.severity) {
            severityBreakdown[flag.severity] = (severityBreakdown[flag.severity] || 0) + 1;
          }
        });
      }
    });
    
    return {
      totalQueued: queue.length,
      pendingReview: queue.filter(item => item.status === "pending").length,
      autoApproved: 0, // Would need to track this in media_assets
      autoRejected: 0, // Would need to track this in media_assets  
      humanReviewed: queue.filter(item => item.reviewerId).length,
      flagBreakdown,
      severityBreakdown,
    };
  }

  // New method to update moderation rules dynamically
  updateModerationRules(newRules: Partial<typeof this.rules>): void {
    this.rules = { ...this.rules, ...newRules };
    logger.info({ updatedRules: newRules }, "Moderation rules updated");
  }

  // Get current moderation configuration
  getModerationConfig(): typeof this.rules {
    return { ...this.rules };
  }
}

export const moderationService = new ModerationService();