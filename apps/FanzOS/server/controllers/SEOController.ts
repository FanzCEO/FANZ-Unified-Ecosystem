import { Request, Response } from 'express';
import { seoService } from '../services/seoService';

export class SEOController {
  /**
   * Create SEO-optimized blog post
   */
  async createBlogPost(req: Request, res: Response) {
    try {
      const creatorId = req.user?.id;
      if (!creatorId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { title, content, tags, featuredImage } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      const blogPost = await seoService.createBlogPost(
        creatorId,
        title,
        content,
        tags || [],
        featuredImage
      );

      res.status(201).json({
        blogPost: {
          id: blogPost.id,
          title: blogPost.title,
          slug: blogPost.slug,
          excerpt: blogPost.excerpt,
          publishedAt: blogPost.publishedAt,
          url: `https://fanslab.com/blog/${blogPost.slug}`,
          seoScore: blogPost.seoOptimization.readabilityScore
        },
        seoOptimization: blogPost.seoOptimization,
        message: 'SEO-optimized blog post created successfully'
      });

    } catch (error) {
      console.error('Error creating blog post:', error);
      res.status(500).json({ 
        error: 'Failed to create blog post',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get SEO analysis for content
   */
  async analyzeSEO(req: Request, res: Response) {
    try {
      const { title, content, tags } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required for analysis' });
      }

      const seoOptimization = await seoService.optimizeContentForSEO(
        title,
        content,
        tags || []
      );

      const seoScore = this.calculateSEOScore(seoOptimization);
      const recommendations = this.generateRecommendations(seoOptimization);

      res.json({
        seoAnalysis: {
          score: seoScore,
          title: seoOptimization.title,
          description: seoOptimization.description,
          keywords: seoOptimization.keywords,
          hashtags: seoOptimization.hashtags,
          readabilityScore: seoOptimization.readabilityScore,
          keywordDensity: seoOptimization.keywordDensity
        },
        recommendations,
        structuredData: seoOptimization.schema,
        analyzedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error analyzing SEO:', error);
      res.status(500).json({ error: 'Failed to analyze SEO' });
    }
  }

  /**
   * Get trending hashtags and keywords
   */
  async getTrendingHashtags(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const category = req.query.category as string;

      const trendingHashtags = await seoService.getTrendingHashtags(limit);

      const filteredHashtags = category ? 
        trendingHashtags.filter(tag => tag.category === category) : 
        trendingHashtags;

      res.json({
        trending: filteredHashtags.map(tag => ({
          hashtag: tag.tag,
          category: tag.category,
          usageCount: tag.usageCount,
          growth: tag.growth || 0,
          trendingScore: this.calculateTrendingScore(tag)
        })),
        total: filteredHashtags.length,
        category: category || 'all',
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting trending hashtags:', error);
      res.status(500).json({ error: 'Failed to get trending hashtags' });
    }
  }

  /**
   * Generate sitemap manually
   */
  async generateSitemap(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId || userRole !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Trigger sitemap generation
      await seoService.generateAndUploadSitemap();

      res.json({
        message: 'Sitemap generated and uploaded successfully',
        url: 'https://fanslab.com/sitemap.xml',
        generatedAt: new Date().toISOString(),
        generatedBy: userId
      });

    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).json({ error: 'Failed to generate sitemap' });
    }
  }

  /**
   * Get comprehensive SEO report
   */
  async getSEOReport(req: Request, res: Response) {
    try {
      const { contentId, contentType } = req.params;

      if (!contentId || !contentType) {
        return res.status(400).json({ error: 'Content ID and type are required' });
      }

      if (!['post', 'blog'].includes(contentType)) {
        return res.status(400).json({ error: 'Invalid content type' });
      }

      const report = await seoService.generateSEOReport(contentId, contentType as 'post' | 'blog');

      res.json({
        report,
        contentId,
        contentType,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error generating SEO report:', error);
      res.status(500).json({ error: 'Failed to generate SEO report' });
    }
  }

  /**
   * Get SEO dashboard data
   */
  async getSEODashboard(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const dashboard = {
        overview: {
          totalBlogPosts: 12,
          averageSEOScore: 78,
          totalViews: 4560,
          searchEngineVisits: 2340,
          topKeywords: ['fitness', 'lifestyle', 'beauty', 'wellness', 'motivation']
        },
        recentPosts: [
          {
            id: '1',
            title: 'Ultimate Fitness Guide for Beginners',
            slug: 'ultimate-fitness-guide-beginners',
            seoScore: 85,
            views: 1240,
            publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            id: '2',
            title: 'Beauty Tips for Glowing Skin',
            slug: 'beauty-tips-glowing-skin',
            seoScore: 72,
            views: 890,
            publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          }
        ],
        keywordPerformance: [
          { keyword: 'fitness tips', ranking: 12, volume: 8900, difficulty: 65 },
          { keyword: 'skincare routine', ranking: 8, volume: 12000, difficulty: 58 },
          { keyword: 'wellness lifestyle', ranking: 23, volume: 3400, difficulty: 72 }
        ],
        sitemapStatus: {
          lastUpdated: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          totalUrls: 1456,
          status: 'active',
          searchEnginesNotified: true
        }
      };

      res.json({
        dashboard,
        userId,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting SEO dashboard:', error);
      res.status(500).json({ error: 'Failed to get SEO dashboard' });
    }
  }

  /**
   * Search and optimize hashtags
   */
  async searchHashtags(req: Request, res: Response) {
    try {
      const { query, limit = 10 } = req.query;

      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      // In production, this would search the hashtags table
      const suggestions = [
        { tag: '#fitness', category: 'fitness', usageCount: 2340, trending: true },
        { tag: '#fitnessmotivation', category: 'fitness', usageCount: 1850, trending: true },
        { tag: '#fitnessjourney', category: 'fitness', usageCount: 1560, trending: false },
        { tag: '#fitnessgirl', category: 'fitness', usageCount: 1290, trending: true },
        { tag: '#fitnesslife', category: 'fitness', usageCount: 980, trending: false }
      ].filter(tag => tag.tag.toLowerCase().includes((query as string).toLowerCase()))
       .slice(0, parseInt(limit as string));

      const optimizedHashtags = suggestions.map(tag => ({
        ...tag,
        seoValue: this.calculateSEOValue(tag),
        recommendation: this.getHashtagRecommendation(tag)
      }));

      res.json({
        hashtags: optimizedHashtags,
        query,
        total: optimizedHashtags.length,
        searchedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error searching hashtags:', error);
      res.status(500).json({ error: 'Failed to search hashtags' });
    }
  }

  /**
   * Utility methods
   */
  private calculateSEOScore(optimization: any): number {
    let score = 0;
    
    // Title optimization (25 points)
    if (optimization.title && optimization.title.length >= 30 && optimization.title.length <= 60) {
      score += 25;
    } else if (optimization.title) {
      score += 15;
    }
    
    // Description optimization (25 points)
    if (optimization.description && optimization.description.length >= 120 && optimization.description.length <= 160) {
      score += 25;
    } else if (optimization.description) {
      score += 15;
    }
    
    // Keywords (20 points)
    if (optimization.keywords && optimization.keywords.length >= 5 && optimization.keywords.length <= 10) {
      score += 20;
    } else if (optimization.keywords && optimization.keywords.length > 0) {
      score += 10;
    }
    
    // Readability (15 points)
    if (optimization.readabilityScore >= 60) {
      score += 15;
    } else if (optimization.readabilityScore >= 30) {
      score += 8;
    }
    
    // Keyword density (10 points)
    if (optimization.keywordDensity >= 1 && optimization.keywordDensity <= 3) {
      score += 10;
    } else if (optimization.keywordDensity > 0) {
      score += 5;
    }
    
    // Structured data (5 points)
    if (optimization.schema) {
      score += 5;
    }
    
    return Math.min(100, score);
  }

  private generateRecommendations(optimization: any): string[] {
    const recommendations: string[] = [];
    
    if (!optimization.title || optimization.title.length < 30) {
      recommendations.push('Optimize your title to be between 30-60 characters');
    }
    
    if (!optimization.description || optimization.description.length < 120) {
      recommendations.push('Write a meta description between 120-160 characters');
    }
    
    if (!optimization.keywords || optimization.keywords.length < 5) {
      recommendations.push('Add 5-10 relevant keywords to your content');
    }
    
    if (optimization.readabilityScore < 60) {
      recommendations.push('Improve readability by using shorter sentences and simpler words');
    }
    
    if (optimization.keywordDensity > 3) {
      recommendations.push('Reduce keyword density to avoid over-optimization');
    } else if (optimization.keywordDensity < 1) {
      recommendations.push('Increase keyword density to 1-3% for better SEO');
    }
    
    return recommendations;
  }

  private calculateTrendingScore(tag: any): number {
    const baseScore = Math.min(100, (tag.usageCount / 100) * 10);
    const growthBonus = Math.min(50, (tag.growth || 0) * 0.5);
    return Math.round(baseScore + growthBonus);
  }

  private calculateSEOValue(tag: any): number {
    // Higher usage count and trending status increase SEO value
    let value = Math.min(80, (tag.usageCount / 100) * 5);
    if (tag.trending) value += 20;
    return Math.round(value);
  }

  private getHashtagRecommendation(tag: any): string {
    if (tag.trending && tag.usageCount > 1000) {
      return 'Highly recommended - trending and popular';
    } else if (tag.trending) {
      return 'Good choice - currently trending';
    } else if (tag.usageCount > 2000) {
      return 'Stable performer - consistently popular';
    } else {
      return 'Consider for niche content';
    }
  }
}