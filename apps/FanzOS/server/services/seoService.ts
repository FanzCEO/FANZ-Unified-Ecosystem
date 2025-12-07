import { db } from "../db";
import { posts, users, blogPosts, hashtags, seoMetadata } from "@shared/schema";
import { eq, desc, like, sql, and, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";
import fs from 'fs/promises';
import path from 'path';

export interface SEOOptimization {
  title: string;
  description: string;
  keywords: string[];
  hashtags: string[];
  canonicalUrl: string;
  ogImage: string;
  schema: any;
  readabilityScore: number;
  keywordDensity: number;
}

export interface BlogPost {
  id: string;
  creatorId: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  featuredImage?: string;
  tags: string[];
  categories: string[];
  publishedAt: Date;
  seoOptimization: SEOOptimization;
  isPublished: boolean;
}

export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  images?: { url: string; title?: string; caption?: string }[];
}

export class SEOService {
  private sitemapUpdateTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startDailySitemapUpdate();
  }

  /**
   * Start daily sitemap update process
   */
  private startDailySitemapUpdate(): void {
    // Update sitemap every 24 hours at 2 AM
    const now = new Date();
    const tomorrow2AM = new Date(now);
    tomorrow2AM.setDate(tomorrow2AM.getDate() + 1);
    tomorrow2AM.setHours(2, 0, 0, 0);
    
    const timeUntilUpdate = tomorrow2AM.getTime() - now.getTime();
    
    setTimeout(() => {
      this.generateAndUploadSitemap();
      
      // Set up recurring updates
      this.sitemapUpdateTimer = setInterval(() => {
        this.generateAndUploadSitemap();
      }, 24 * 60 * 60 * 1000); // Every 24 hours
      
    }, timeUntilUpdate);
    
    console.log(`Daily sitemap update scheduled for ${tomorrow2AM.toLocaleString()}`);
  }

  /**
   * Create optimized blog post with SEO
   */
  async createBlogPost(
    creatorId: string,
    title: string,
    content: string,
    tags: string[] = [],
    featuredImage?: string
  ): Promise<BlogPost> {
    const slug = this.generateSlug(title);
    const excerpt = this.generateExcerpt(content);
    const seoOptimization = await this.optimizeContentForSEO(title, content, tags);
    
    const blogPost: BlogPost = {
      id: randomUUID(),
      creatorId,
      title,
      content,
      excerpt,
      slug,
      featuredImage,
      tags,
      categories: await this.inferCategories(content, tags),
      publishedAt: new Date(),
      seoOptimization,
      isPublished: true
    };

    // Save to database
    await this.saveBlogPost(blogPost);
    
    // Update sitemap immediately for new content
    await this.generateAndUploadSitemap();
    
    // Process and save hashtags
    await this.processHashtags(tags, creatorId);
    
    console.log(`Created SEO-optimized blog post: ${title}`);
    return blogPost;
  }

  /**
   * Generate comprehensive SEO optimization for content
   */
  async optimizeContentForSEO(
    title: string,
    content: string,
    tags: string[] = []
  ): Promise<SEOOptimization> {
    // Extract keywords from content
    const extractedKeywords = this.extractKeywords(content);
    const allKeywords = [...new Set([...extractedKeywords, ...tags])];
    
    // Generate optimized meta description
    const description = this.generateMetaDescription(content);
    
    // Create hashtags from keywords
    const hashtags = this.generateHashtags(allKeywords);
    
    // Calculate content metrics
    const readabilityScore = this.calculateReadabilityScore(content);
    const keywordDensity = this.calculateKeywordDensity(content, allKeywords);
    
    // Generate structured data schema
    const schema = this.generateStructuredData(title, description, content, allKeywords);
    
    return {
      title: this.optimizeTitle(title, allKeywords),
      description,
      keywords: allKeywords.slice(0, 10), // Limit to top 10 keywords
      hashtags,
      canonicalUrl: `https://fanslab.com/blog/${this.generateSlug(title)}`,
      ogImage: '', // Would be set from featuredImage
      schema,
      readabilityScore,
      keywordDensity
    };
  }

  /**
   * Generate and upload comprehensive sitemap
   */
  async generateAndUploadSitemap(): Promise<void> {
    try {
      console.log('Generating comprehensive sitemap...');
      
      const sitemapEntries: SitemapEntry[] = [];
      
      // Add creator profiles
      const creators = await this.getCreatorProfiles();
      creators.forEach(creator => {
        sitemapEntries.push({
          url: `https://fanslab.com/creator/${creator.username}`,
          lastModified: new Date(creator.updatedAt || creator.createdAt),
          changeFrequency: 'weekly',
          priority: 0.8,
          images: creator.profileImageUrl ? [{
            url: creator.profileImageUrl,
            title: `${creator.displayName || creator.username} - Creator Profile`,
            caption: creator.bio || ''
          }] : undefined
        });
      });

      // Add blog posts
      const blogPosts = await this.getBlogPosts();
      blogPosts.forEach(post => {
        sitemapEntries.push({
          url: `https://fanslab.com/blog/${post.slug}`,
          lastModified: new Date(post.updatedAt || post.publishedAt),
          changeFrequency: 'monthly',
          priority: 0.7,
          images: post.featuredImage ? [{
            url: post.featuredImage,
            title: post.title,
            caption: post.excerpt
          }] : undefined
        });
      });

      // Add public posts with media
      const publicPosts = await this.getPublicPosts();
      publicPosts.forEach(post => {
        if (post.mediaUrl) {
          sitemapEntries.push({
            url: `https://fanslab.com/post/${post.id}`,
            lastModified: new Date(post.updatedAt || post.createdAt),
            changeFrequency: 'daily',
            priority: 0.6,
            images: [{
              url: post.mediaUrl,
              title: post.content.substring(0, 100),
              caption: post.content.substring(0, 200)
            }]
          });
        }
      });

      // Add category and tag pages
      const categories = await this.getCategories();
      categories.forEach(category => {
        sitemapEntries.push({
          url: `https://fanslab.com/category/${this.generateSlug(category)}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.5
        });
      });

      // Add hashtag pages
      const popularHashtags = await this.getPopularHashtags();
      popularHashtags.forEach(hashtag => {
        sitemapEntries.push({
          url: `https://fanslab.com/hashtag/${hashtag.tag.replace('#', '')}`,
          lastModified: new Date(hashtag.lastUsed),
          changeFrequency: 'daily',
          priority: 0.4
        });
      });

      // Generate XML sitemap
      const sitemapXml = this.generateSitemapXML(sitemapEntries);
      
      // Generate sitemap index for large sites
      const sitemapIndex = this.generateSitemapIndex(sitemapEntries);
      
      // Save to public directory
      await this.saveSitemapFiles(sitemapXml, sitemapIndex);
      
      // Update search engines
      await this.pingSearchEngines();
      
      console.log(`Sitemap updated with ${sitemapEntries.length} entries`);
      
    } catch (error) {
      console.error('Failed to generate sitemap:', error);
    }
  }

  /**
   * Process and categorize hashtags
   */
  async processHashtags(tags: string[], creatorId: string): Promise<void> {
    for (const tag of tags) {
      const hashtagData = {
        id: randomUUID(),
        tag: tag.startsWith('#') ? tag : `#${tag}`,
        category: this.categorizeHashtag(tag),
        usageCount: 1,
        lastUsed: new Date(),
        creatorId
      };

      try {
        // Check if hashtag exists
        const existing = await db
          .select()
          .from(hashtags)
          .where(eq(hashtags.tag, hashtagData.tag))
          .limit(1);

        if (existing.length > 0) {
          // Update usage count
          await db
            .update(hashtags)
            .set({
              usageCount: sql`${hashtags.usageCount} + 1`,
              lastUsed: new Date()
            })
            .where(eq(hashtags.id, existing[0].id));
        } else {
          // Insert new hashtag
          await db.insert(hashtags).values(hashtagData);
        }
      } catch (error) {
        console.error('Error processing hashtag:', tag, error);
      }
    }
  }

  /**
   * Generate trending hashtags and keywords
   */
  async getTrendingHashtags(limit: number = 20): Promise<any[]> {
    try {
      return await db
        .select({
          tag: hashtags.tag,
          usageCount: hashtags.usageCount,
          category: hashtags.category,
          growth: sql<number>`
            (${hashtags.usageCount} - COALESCE(
              (SELECT usage_count FROM hashtags h2 
               WHERE h2.tag = ${hashtags.tag} 
               AND h2.last_used < NOW() - INTERVAL '7 days' 
               LIMIT 1), 0
            )) * 100.0 / GREATEST(${hashtags.usageCount}, 1)
          `
        })
        .from(hashtags)
        .orderBy(desc(sql`usage_count * (
          CASE 
            WHEN last_used > NOW() - INTERVAL '24 hours' THEN 3
            WHEN last_used > NOW() - INTERVAL '7 days' THEN 2
            ELSE 1
          END
        )`))
        .limit(limit);
    } catch (error) {
      console.error('Error getting trending hashtags:', error);
      return [];
    }
  }

  /**
   * Generate SEO report for content
   */
  async generateSEOReport(contentId: string, contentType: 'post' | 'blog'): Promise<any> {
    try {
      let content: any;
      
      if (contentType === 'blog') {
        [content] = await db
          .select()
          .from(blogPosts)
          .where(eq(blogPosts.id, contentId))
          .limit(1);
      } else {
        [content] = await db
          .select()
          .from(posts)
          .where(eq(posts.id, contentId))
          .limit(1);
      }

      if (!content) {
        throw new Error('Content not found');
      }

      const seoData = contentType === 'blog' ? 
        JSON.parse(content.seoOptimization || '{}') : 
        await this.optimizeContentForSEO(content.title || '', content.content, []);

      return {
        contentId,
        contentType,
        seoScore: this.calculateSEOScore(seoData),
        recommendations: this.generateSEORecommendations(seoData),
        keywords: seoData.keywords || [],
        readabilityScore: seoData.readabilityScore || 0,
        keywordDensity: seoData.keywordDensity || 0,
        metaData: {
          title: seoData.title,
          description: seoData.description,
          canonicalUrl: seoData.canonicalUrl
        },
        structuredData: seoData.schema,
        lastUpdated: new Date()
      };
      
    } catch (error) {
      console.error('Error generating SEO report:', error);
      throw error;
    }
  }

  /**
   * Utility methods for SEO optimization
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }

  private generateExcerpt(content: string, length: number = 160): string {
    const plainText = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return plainText.length > length ? 
      plainText.substring(0, length) + '...' : 
      plainText;
  }

  private extractKeywords(content: string): string[] {
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }

  private generateMetaDescription(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let description = '';
    
    for (const sentence of sentences) {
      const cleanSentence = sentence.replace(/<[^>]*>/g, '').trim();
      if (description.length + cleanSentence.length <= 155) {
        description += (description ? ' ' : '') + cleanSentence + '.';
      } else {
        break;
      }
    }
    
    return description || content.substring(0, 155) + '...';
  }

  private generateHashtags(keywords: string[]): string[] {
    return keywords
      .slice(0, 10)
      .map(keyword => `#${keyword.replace(/\s+/g, '')}`)
      .filter(hashtag => hashtag.length > 3 && hashtag.length <= 30);
  }

  private optimizeTitle(title: string, keywords: string[]): string {
    // Ensure title contains primary keyword and is under 60 characters
    const primaryKeyword = keywords[0];
    if (primaryKeyword && !title.toLowerCase().includes(primaryKeyword)) {
      title = `${primaryKeyword} - ${title}`;
    }
    
    return title.length > 60 ? title.substring(0, 57) + '...' : title;
  }

  private calculateReadabilityScore(content: string): number {
    // Simplified Flesch Reading Ease calculation
    const sentences = content.split(/[.!?]+/).length - 1;
    const words = content.split(/\s+/).length;
    const syllables = this.countSyllables(content);
    
    if (sentences === 0 || words === 0) return 0;
    
    const avgSentenceLength = words / sentences;
    const avgSyllablesPerWord = syllables / words;
    
    const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private countSyllables(text: string): number {
    return text.toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[aeiouy]+/g, 'a')
      .length;
  }

  private calculateKeywordDensity(content: string, keywords: string[]): number {
    const words = content.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    let keywordCount = 0;
    
    keywords.forEach(keyword => {
      const keywordWords = keyword.toLowerCase().split(/\s+/);
      keywordCount += keywordWords.filter(word => words.includes(word)).length;
    });
    
    return totalWords > 0 ? (keywordCount / totalWords) * 100 : 0;
  }

  private generateStructuredData(title: string, description: string, content: string, keywords: string[]): any {
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": title,
      "description": description,
      "keywords": keywords.join(', '),
      "datePublished": new Date().toISOString(),
      "dateModified": new Date().toISOString(),
      "author": {
        "@type": "Person",
        "name": "FansLab Creator"
      },
      "publisher": {
        "@type": "Organization",
        "name": "FansLab",
        "url": "https://fanslab.com"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://fanslab.com"
      }
    };
  }

  private async inferCategories(content: string, tags: string[]): Promise<string[]> {
    const categoryKeywords = {
      'fitness': ['workout', 'exercise', 'gym', 'health', 'fitness', 'muscle'],
      'beauty': ['makeup', 'skincare', 'beauty', 'cosmetics', 'hair'],
      'lifestyle': ['lifestyle', 'daily', 'routine', 'life', 'personal'],
      'fashion': ['fashion', 'style', 'clothing', 'outfit', 'designer'],
      'entertainment': ['fun', 'entertainment', 'show', 'performance', 'music'],
      'education': ['tutorial', 'how-to', 'guide', 'learn', 'education']
    };

    const categories: string[] = [];
    const lowerContent = content.toLowerCase();
    const lowerTags = tags.map(t => t.toLowerCase());

    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      const matches = keywords.filter(keyword => 
        lowerContent.includes(keyword) || lowerTags.includes(keyword)
      );
      if (matches.length > 0) {
        categories.push(category);
      }
    });

    return categories.length > 0 ? categories : ['general'];
  }

  private categorizeHashtag(tag: string): string {
    const lowerTag = tag.toLowerCase();
    
    if (lowerTag.match(/fit|gym|health|workout/)) return 'fitness';
    if (lowerTag.match(/beauty|makeup|skincare/)) return 'beauty';
    if (lowerTag.match(/fashion|style|outfit/)) return 'fashion';
    if (lowerTag.match(/food|recipe|cooking/)) return 'food';
    if (lowerTag.match(/travel|vacation|adventure/)) return 'travel';
    if (lowerTag.match(/music|dance|art/)) return 'creative';
    
    return 'general';
  }

  private generateSitemapXML(entries: SitemapEntry[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ';
    xml += 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    entries.forEach(entry => {
      xml += '  <url>\n';
      xml += `    <loc>${entry.url}</loc>\n`;
      xml += `    <lastmod>${entry.lastModified.toISOString().split('T')[0]}</lastmod>\n`;
      xml += `    <changefreq>${entry.changeFrequency}</changefreq>\n`;
      xml += `    <priority>${entry.priority}</priority>\n`;
      
      if (entry.images) {
        entry.images.forEach(image => {
          xml += '    <image:image>\n';
          xml += `      <image:loc>${image.url}</image:loc>\n`;
          if (image.title) xml += `      <image:title><![CDATA[${image.title}]]></image:title>\n`;
          if (image.caption) xml += `      <image:caption><![CDATA[${image.caption}]]></image:caption>\n`;
          xml += '    </image:image>\n';
        });
      }
      
      xml += '  </url>\n';
    });

    xml += '</urlset>';
    return xml;
  }

  private generateSitemapIndex(entries: SitemapEntry[]): string {
    const chunkSize = 50000; // Max URLs per sitemap
    const chunks = Math.ceil(entries.length / chunkSize);
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (let i = 0; i < chunks; i++) {
      xml += '  <sitemap>\n';
      xml += `    <loc>https://fanslab.com/sitemap-${i + 1}.xml</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
      xml += '  </sitemap>\n';
    }

    xml += '</sitemapindex>';
    return xml;
  }

  private async saveSitemapFiles(sitemapXml: string, sitemapIndex: string): Promise<void> {
    try {
      const publicDir = path.join(process.cwd(), 'public');
      await fs.mkdir(publicDir, { recursive: true });
      
      await fs.writeFile(path.join(publicDir, 'sitemap.xml'), sitemapXml);
      await fs.writeFile(path.join(publicDir, 'sitemap-index.xml'), sitemapIndex);
      
      console.log('Sitemap files saved to public directory');
    } catch (error) {
      console.error('Failed to save sitemap files:', error);
    }
  }

  private async saveBlogPost(blogPost: BlogPost): Promise<void> {
    try {
      await db.insert(blogPosts).values({
        id: blogPost.id,
        creatorId: blogPost.creatorId,
        title: blogPost.title,
        content: blogPost.content,
        excerpt: blogPost.excerpt,
        slug: blogPost.slug,
        featuredImage: blogPost.featuredImage,
        tags: JSON.stringify(blogPost.tags),
        categories: JSON.stringify(blogPost.categories),
        publishedAt: blogPost.publishedAt,
        seoOptimization: JSON.stringify(blogPost.seoOptimization),
        isPublished: blogPost.isPublished
      });
    } catch (error) {
      console.error('Failed to save blog post:', error);
      throw error;
    }
  }

  private calculateSEOScore(seoData: SEOOptimization): number {
    let score = 0;
    
    // Title optimization (20 points)
    if (seoData.title && seoData.title.length >= 30 && seoData.title.length <= 60) {
      score += 20;
    } else if (seoData.title) {
      score += 10;
    }
    
    // Description optimization (20 points)
    if (seoData.description && seoData.description.length >= 120 && seoData.description.length <= 160) {
      score += 20;
    } else if (seoData.description) {
      score += 10;
    }
    
    // Keywords (20 points)
    if (seoData.keywords && seoData.keywords.length >= 5 && seoData.keywords.length <= 10) {
      score += 20;
    } else if (seoData.keywords && seoData.keywords.length > 0) {
      score += 10;
    }
    
    // Readability (20 points)
    if (seoData.readabilityScore >= 60) {
      score += 20;
    } else if (seoData.readabilityScore >= 30) {
      score += 10;
    }
    
    // Keyword density (10 points)
    if (seoData.keywordDensity >= 1 && seoData.keywordDensity <= 3) {
      score += 10;
    } else if (seoData.keywordDensity > 0) {
      score += 5;
    }
    
    // Structured data (10 points)
    if (seoData.schema) {
      score += 10;
    }
    
    return score;
  }

  private generateSEORecommendations(seoData: SEOOptimization): string[] {
    const recommendations: string[] = [];
    
    if (!seoData.title || seoData.title.length < 30) {
      recommendations.push('Optimize your title to be between 30-60 characters');
    }
    
    if (!seoData.description || seoData.description.length < 120) {
      recommendations.push('Write a meta description between 120-160 characters');
    }
    
    if (!seoData.keywords || seoData.keywords.length < 5) {
      recommendations.push('Add 5-10 relevant keywords to your content');
    }
    
    if (seoData.readabilityScore < 60) {
      recommendations.push('Improve readability by using shorter sentences and simpler words');
    }
    
    if (seoData.keywordDensity > 3) {
      recommendations.push('Reduce keyword density to avoid over-optimization');
    } else if (seoData.keywordDensity < 1) {
      recommendations.push('Increase keyword density to 1-3% for better SEO');
    }
    
    return recommendations;
  }

  // Database query methods
  private async getCreatorProfiles(): Promise<any[]> {
    try {
      return await db
        .select()
        .from(users)
        .where(eq(users.role, 'creator'));
    } catch (error) {
      console.error('Error fetching creator profiles:', error);
      return [];
    }
  }

  private async getBlogPosts(): Promise<any[]> {
    try {
      return await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.isPublished, true))
        .orderBy(desc(blogPosts.publishedAt));
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      return [];
    }
  }

  private async getPublicPosts(): Promise<any[]> {
    try {
      return await db
        .select()
        .from(posts)
        .where(and(
          eq(posts.postType, 'free'),
          sql`${posts.mediaUrl} IS NOT NULL`
        ))
        .orderBy(desc(posts.createdAt))
        .limit(1000);
    } catch (error) {
      console.error('Error fetching public posts:', error);
      return [];
    }
  }

  private async getCategories(): Promise<string[]> {
    return ['fitness', 'beauty', 'lifestyle', 'fashion', 'entertainment', 'education'];
  }

  private async getPopularHashtags(): Promise<any[]> {
    try {
      return await db
        .select()
        .from(hashtags)
        .orderBy(desc(hashtags.usageCount))
        .limit(100);
    } catch (error) {
      console.error('Error fetching popular hashtags:', error);
      return [];
    }
  }

  private async pingSearchEngines(): Promise<void> {
    const sitemapUrl = 'https://fanslab.com/sitemap.xml';
    const searchEngines = [
      `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
      `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    ];

    for (const url of searchEngines) {
      try {
        await fetch(url);
        console.log(`Pinged search engine: ${url}`);
      } catch (error) {
        console.error(`Failed to ping search engine ${url}:`, error);
      }
    }
  }
}

export const seoService = new SEOService();