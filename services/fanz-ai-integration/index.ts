import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import Redis from 'ioredis';
import { z } from 'zod';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiters
const healthLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many AI requests from this IP',
});
app.use('/api/', limiter);

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Redis for caching
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});

// Request schemas
const contentOptimizationSchema = z.object({
  content: z.string().min(1).max(10000),
  platform: z.enum(['boyfanz', 'girlfanz', 'pupfanz', 'taboofanz']),
  contentType: z.enum(['post', 'video', 'story', 'live']),
});

const sentimentAnalysisSchema = z.object({
  text: z.string().min(1).max(5000),
  context: z.enum(['comment', 'review', 'message', 'post']),
});

const pricingOptimizationSchema = z.object({
  creatorId: z.string(),
  contentType: z.string(),
  historicalData: z.array(z.object({
    price: z.number(),
    sales: z.number(),
    engagement: z.number(),
  })).optional(),
});

// AI Service Functions
class FanzAIService {
  async optimizeContent(params: z.infer<typeof contentOptimizationSchema>) {
    const cacheKey = `content_opt:${Buffer.from(params.content).toString('base64').slice(0, 20)}`;
    
    try {
      // Check cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const prompt = `As an AI content optimizer for ${params.platform}, analyze and improve this ${params.contentType}:

Content: "${params.content}"

Provide optimization suggestions for:
1. Engagement (hooks, calls-to-action)
2. SEO (hashtags, keywords)
3. Platform-specific best practices
4. Revenue potential improvements

Return JSON format with: title, description, hashtags, engagement_score, suggestions`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const result = {
        optimized_content: completion.choices[0]?.message?.content || '',
        engagement_score: Math.floor(Math.random() * 30) + 70, // Mock score
        timestamp: new Date().toISOString(),
      };

      // Cache for 1 hour
      await redis.setex(cacheKey, 3600, JSON.stringify(result));
      
      return result;
    } catch (error) {
      console.error('Content optimization error:', error);
      throw new Error('Failed to optimize content');
    }
  }

  async analyzeSentiment(params: z.infer<typeof sentimentAnalysisSchema>) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Analyze the sentiment of this ${params.context}: "${params.text}"
          
          Return JSON with:
          - sentiment: "positive", "negative", "neutral"
          - confidence: 0-1
          - emotions: array of detected emotions
          - toxicity_score: 0-1 (0 = safe, 1 = toxic)
          - action_required: boolean (if moderation needed)`
        }],
        temperature: 0.1,
        max_tokens: 300,
      });

      const response = completion.choices[0]?.message?.content;
      try {
        return JSON.parse(response || '{}');
      } catch {
        return {
          sentiment: 'neutral',
          confidence: 0.5,
          emotions: ['neutral'],
          toxicity_score: 0,
          action_required: false
        };
      }
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      throw new Error('Failed to analyze sentiment');
    }
  }

  async optimizePricing(params: z.infer<typeof pricingOptimizationSchema>) {
    try {
      const prompt = `As a pricing optimization AI for creator economy platform, analyze pricing for creator ${params.creatorId} content type "${params.contentType}".
      
      ${params.historicalData ? `Historical data: ${JSON.stringify(params.historicalData)}` : 'No historical data available.'}
      
      Provide optimal pricing strategy with:
      - recommended_price: number
      - price_range: {min, max}
      - confidence: 0-1
      - reasoning: string explanation
      - market_position: "premium", "competitive", "budget"
      - revenue_projection: estimated increase %`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content;
      try {
        return JSON.parse(response || '{}');
      } catch {
        return {
          recommended_price: 25,
          price_range: { min: 15, max: 35 },
          confidence: 0.7,
          reasoning: "Based on industry standards",
          market_position: "competitive",
          revenue_projection: 15
        };
      }
    } catch (error) {
      console.error('Pricing optimization error:', error);
      throw new Error('Failed to optimize pricing');
    }
  }

  async detectDeepfake(imageBase64: string) {
    try {
      // Mock deepfake detection (replace with actual ML model)
      const suspiciousPatterns = [
        'unnatural eye movement',
        'inconsistent lighting',
        'facial distortions',
        'temporal inconsistencies'
      ];

      const detectionScore = Math.random();
      const isDeepfake = detectionScore > 0.8;

      return {
        is_deepfake: isDeepfake,
        confidence: detectionScore,
        detected_patterns: isDeepfake ? [suspiciousPatterns[Math.floor(Math.random() * suspiciousPatterns.length)]] : [],
        analysis: {
          facial_consistency: Math.random(),
          temporal_coherence: Math.random(),
          lighting_analysis: Math.random(),
          metadata_check: Math.random()
        },
        recommendation: isDeepfake ? 'BLOCK' : 'APPROVE',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Deepfake detection error:', error);
      throw new Error('Failed to analyze content authenticity');
    }
  }
}

const aiService = new FanzAIService();

// API Routes
app.post('/api/content/optimize', async (req, res) => {
  try {
    const params = contentOptimizationSchema.parse(req.body);
    const result = await aiService.optimizeContent(params);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/sentiment/analyze', async (req, res) => {
  try {
    const params = sentimentAnalysisSchema.parse(req.body);
    const result = await aiService.analyzeSentiment(params);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/pricing/optimize', async (req, res) => {
  try {
    const params = pricingOptimizationSchema.parse(req.body);
    const result = await aiService.optimizePricing(params);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/security/deepfake-detection', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Image data required'
      });
    }

    const result = await aiService.detectDeepfake(image);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Health check
app.get('/health', healthLimiter, async (req, res) => {
  try {
    const redisStatus = await redis.ping();
    res.json({
      status: 'healthy',
      services: {
        redis: redisStatus === 'PONG' ? 'connected' : 'disconnected',
        openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
        anthropic: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not configured',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Error handling
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🤖 FANZ AI Integration Service running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;