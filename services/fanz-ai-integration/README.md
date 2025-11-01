# 🤖 FANZ AI Integration Service

Revolutionary AI-powered intelligence service for the FANZ Creator Economy ecosystem. This service provides production-ready AI capabilities including content optimization, sentiment analysis, deepfake detection, and dynamic pricing algorithms.

## 🚀 Features

### Core AI Capabilities
- **Content Optimization** - AI-powered content analysis and improvement suggestions
- **Sentiment Analysis** - Real-time mood and engagement tracking with toxicity detection
- **Dynamic Pricing** - AI-driven revenue optimization for creator content
- **Deepfake Detection** - Advanced security for content authenticity
- **Multi-language Support** - Global accessibility features
- **Performance Analytics** - Deep insights and predictive modeling

### Technical Excellence
- **Real-time Processing** - Sub-100ms API response times
- **Redis Caching** - Intelligent caching for performance optimization
- **Rate Limiting** - Protection against abuse and DoS attacks
- **Health Monitoring** - Comprehensive service health checks
- **Error Handling** - Robust error recovery and logging
- **Type Safety** - Full TypeScript implementation with Zod validation

## 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **Redis** 6.0 or higher
- **OpenAI API Key** (for GPT models)
- **Anthropic API Key** (for Claude models)
- **Docker** (optional, for containerized deployment)

## 🔧 Installation

### 1. Clone and Setup
```bash
cd services/fanz-ai-integration
npm install
```

### 2. Environment Configuration
```bash
cp .env.template .env
# Edit .env with your API keys and configuration
```

### 3. Start Redis (if not using Docker)
```bash
redis-server
```

### 4. Development Mode
```bash
npm run dev
```

### 5. Production Build
```bash
npm run build
npm start
```

## 🐳 Docker Setup

### Quick Start with Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f fanz-ai-service

# Stop services
docker-compose down
```

### Manual Docker Build
```bash
# Build image
docker build -t fanz-ai-integration .

# Run with environment variables
docker run -d \
  -p 3001:3001 \
  -e OPENAI_API_KEY=your_key \
  -e REDIS_HOST=your_redis_host \
  fanz-ai-integration
```

## 🔗 API Endpoints

### Health Check
```bash
GET /health
```
Returns service health status and dependency connections.

### Content Optimization
```bash
POST /api/content/optimize
Content-Type: application/json

{
  "content": "Check out my new post!",
  "platform": "boyfanz",
  "contentType": "post"
}
```

### Sentiment Analysis
```bash
POST /api/sentiment/analyze
Content-Type: application/json

{
  "text": "This is an amazing creator!",
  "context": "comment"
}
```

### Pricing Optimization
```bash
POST /api/pricing/optimize
Content-Type: application/json

{
  "creatorId": "creator123",
  "contentType": "premium_video",
  "historicalData": [
    {
      "price": 25,
      "sales": 150,
      "engagement": 0.85
    }
  ]
}
```

### Deepfake Detection
```bash
POST /api/security/deepfake-detection
Content-Type: application/json

{
  "image": "base64_encoded_image_data"
}
```

## 📊 Monitoring & Dashboard

Access the AI Performance Dashboard at:
- **Development**: `http://localhost:3001/dashboard`
- **Redis Commander**: `http://localhost:8081`

### Key Metrics Monitored
- Request volume and response times
- Success and error rates
- Cache hit rates
- AI service usage statistics
- Deepfake detection alerts
- Sentiment analysis trends

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 3001 |
| `OPENAI_API_KEY` | OpenAI API key | Yes | - |
| `ANTHROPIC_API_KEY` | Anthropic API key | Yes | - |
| `REDIS_HOST` | Redis host | No | localhost |
| `REDIS_PORT` | Redis port | No | 6379 |
| `NODE_ENV` | Environment | No | development |
| `LOG_LEVEL` | Logging level | No | info |

### Feature Flags
Enable/disable AI features via environment variables:
```bash
DEEPFAKE_DETECTION_ENABLED=true
SENTIMENT_ANALYSIS_ENABLED=true
CONTENT_OPTIMIZATION_ENABLED=true
PRICING_OPTIMIZATION_ENABLED=true
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### API Testing with curl
```bash
# Health check
curl http://localhost:3001/health | jq

# Content optimization
curl -X POST http://localhost:3001/api/content/optimize \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello world!","platform":"boyfanz","contentType":"post"}' \
  | jq
```

## 🔒 Security Features

- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Helmet.js** - Security headers and XSS protection
- **Input Validation** - Zod schema validation for all inputs
- **CORS Protection** - Configurable cross-origin resource sharing
- **Health Monitoring** - Real-time service health checks

## 🚀 Performance Optimization

### Caching Strategy
- **Content Optimization**: 1 hour cache
- **Sentiment Analysis**: 30 minutes cache
- **Pricing Recommendations**: 2 hours cache

### Response Time Targets
- **Content Optimization**: < 2 seconds
- **Sentiment Analysis**: < 500ms
- **Deepfake Detection**: < 3 seconds
- **Health Check**: < 100ms

## 📈 Scaling & Production

### Horizontal Scaling
```bash
# Run multiple instances
docker-compose up --scale fanz-ai-service=3
```

### Load Balancing
Configure your load balancer to distribute traffic across instances:
- Health check endpoint: `/health`
- Sticky sessions: Not required
- Connection timeout: 30 seconds

### Monitoring Integration
- **Prometheus** metrics available at `/metrics`
- **OpenTelemetry** tracing enabled
- **Structured logging** with JSON format

## 🛠️ Development

### Code Style
```bash
npm run lint        # ESLint
npm run format      # Prettier
```

### Database Schema
The service uses Redis for caching only. No persistent database required.

### Adding New AI Features
1. Add endpoint to `index.ts`
2. Implement service method in `FanzAIService` class
3. Add request/response schemas with Zod
4. Update documentation and tests

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
- name: Test AI Service
  run: |
    cd services/fanz-ai-integration
    npm test
    npm run lint
```

### Health Check for Load Balancer
```bash
GET /health
# Returns 200 OK when healthy
# Returns 500 when unhealthy
```

## 🆘 Troubleshooting

### Common Issues

**Redis Connection Failed**
```bash
# Check Redis status
redis-cli ping
# Expected: PONG
```

**OpenAI API Errors**
```bash
# Check API key validity
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

**High Memory Usage**
```bash
# Check Redis memory
redis-cli INFO memory
# Consider increasing cache TTL or reducing cache size
```

### Debug Mode
```bash
export LOG_LEVEL=debug
npm run dev
```

## 📝 License

Private - FANZ Team Only

## 🤝 Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Ensure all CI checks pass

---

**🔥 Revolutionary AI for the Adult Creator Economy**
*Built by FANZ Team - Powering the future of creator monetization*