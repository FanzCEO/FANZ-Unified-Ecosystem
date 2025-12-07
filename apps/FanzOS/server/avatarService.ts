import { storage } from './storage';

export interface AvatarFeatures {
  // Basic Info
  gender: 'feminine' | 'masculine' | 'non-binary';
  bodyType: 'slim' | 'athletic' | 'curvy' | 'plus-size' | 'muscular';
  
  // Face Features
  skinTone: number; // 0-100
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'diamond';
  eyeShape: 'almond' | 'round' | 'hooded' | 'monolid' | 'upturned' | 'downturned';
  eyeColor: string;
  eyebrowStyle: 'natural' | 'arched' | 'straight' | 'bold' | 'thin';
  noseShape: 'straight' | 'button' | 'roman' | 'wide' | 'narrow';
  lipShape: 'full' | 'thin' | 'heart' | 'wide' | 'pouty';
  lipColor: string;
  
  // Hair
  hairStyle: string;
  hairColor: string;
  hairLength: 'short' | 'medium' | 'long' | 'bald';
  
  // Body Features (18+ appropriate)
  bustSize: number; // 0-100
  waistSize: number; // 0-100
  hipSize: number; // 0-100
  height: number; // 0-100
  muscleTone: number; // 0-100
  
  // Style & Clothing
  outfit: string;
  accessories: string[];
  makeup: {
    foundation: number;
    eyeshadow: string;
    eyeliner: number;
    mascara: number;
    blush: number;
    highlighter: number;
  };
  
  // Personality Expression
  pose: 'confident' | 'playful' | 'seductive' | 'casual' | 'professional';
  expression: 'smile' | 'smirk' | 'wink' | 'pout' | 'serious' | 'flirty';
  confidence: number; // 0-100
}

export interface CreatorAvatar {
  id: string;
  userId: string;
  name: string;
  features: AvatarFeatures;
  imageUrl?: string;
  style: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class AvatarService {
  async saveAvatar(userId: string, avatar: AvatarFeatures, name?: string): Promise<CreatorAvatar> {
    try {
      const avatarData = {
        userId,
        name: name || `Avatar ${Date.now()}`,
        features: avatar,
        style: this.determineAvatarStyle(avatar),
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const savedAvatar = await storage.createAvatar(avatarData);
      return savedAvatar;
    } catch (error) {
      console.error('Error saving avatar:', error);
      throw new Error('Failed to save avatar');
    }
  }

  async generateAvatarImage(userId: string, avatar: AvatarFeatures): Promise<{ imageUrl: string }> {
    try {
      // In a real implementation, this would use an AI image generation service
      // For now, we'll create a placeholder URL
      const imageUrl = await this.createAvatarImage(avatar);
      
      return { imageUrl };
    } catch (error) {
      console.error('Error generating avatar image:', error);
      throw new Error('Failed to generate avatar image');
    }
  }

  async getUserAvatars(userId: string): Promise<CreatorAvatar[]> {
    try {
      const avatars = await storage.getAvatarsByUserId(userId);
      return avatars;
    } catch (error) {
      console.error('Error fetching user avatars:', error);
      throw new Error('Failed to fetch avatars');
    }
  }

  async deleteAvatar(avatarId: string, userId: string): Promise<void> {
    try {
      const avatar = await storage.getAvatar(avatarId);
      if (!avatar || avatar.userId !== userId) {
        throw new Error('Avatar not found or access denied');
      }

      await storage.deleteAvatar(avatarId);
    } catch (error) {
      console.error('Error deleting avatar:', error);
      throw new Error('Failed to delete avatar');
    }
  }

  private determineAvatarStyle(features: AvatarFeatures): string {
    // Analyze features to determine overall style
    const styles = [];
    
    if (features.confidence > 75) styles.push('Bold');
    if (features.pose === 'professional') styles.push('Professional');
    if (features.pose === 'glamorous' || features.makeup.foundation > 60) styles.push('Glamorous');
    if (features.pose === 'casual') styles.push('Casual');
    if (features.pose === 'playful') styles.push('Playful');
    
    return styles.length > 0 ? styles.join(', ') : 'Classic';
  }

  private async createAvatarImage(avatar: AvatarFeatures): Promise<string> {
    // This would integrate with an AI image generation service
    // For now, return a placeholder based on avatar characteristics
    const baseUrl = 'https://api.avatars.fanslab.com/generate';
    const params = new URLSearchParams({
      gender: avatar.gender,
      skinTone: avatar.skinTone.toString(),
      hairColor: avatar.hairColor,
      eyeColor: avatar.eyeColor,
      style: avatar.pose,
      timestamp: Date.now().toString()
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  async getAvatarTemplates(category?: string): Promise<any[]> {
    // In a real implementation, this would fetch from a template database
    const templates = [
      {
        id: 'template_1',
        name: 'Elegant Rose',
        category: 'feminine',
        preview: '/api/templates/elegant-rose-preview.png',
        features: {
          gender: 'feminine',
          bodyType: 'athletic',
          skinTone: 40,
          faceShape: 'oval',
          hairStyle: 'Long Wavy',
          hairColor: '#8B4513',
          lipColor: '#FF6B9D',
          pose: 'confident',
          expression: 'smile'
        }
      },
      {
        id: 'template_2',
        name: 'Bold Thunder',
        category: 'masculine',
        preview: '/api/templates/bold-thunder-preview.png',
        features: {
          gender: 'masculine',
          bodyType: 'muscular',
          skinTone: 60,
          faceShape: 'square',
          hairStyle: 'Undercut',
          hairColor: '#2C1810',
          pose: 'confident',
          expression: 'serious'
        }
      }
    ];

    return category ? templates.filter(t => t.category === category) : templates;
  }
}

export const avatarService = new AvatarService();