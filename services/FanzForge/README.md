# FANZ Cross-Platform Ad System

A complete advertising platform for the FANZ ecosystem, supporting all platforms (BoyFanz, GirlFanz, PupFanz, TabooFanz, DaddiesFanz, CougarFanz) with adult-friendly payment processors and comprehensive ad management.

## 🚀 Features

- **Cross-Platform Support**: Works across all FANZ platforms
- **Adult-Friendly Payments**: CCBill, Segpay, Epoch, crypto (NO Stripe/PayPal)
- **Advanced Targeting**: Device, geo, platform, behavioral targeting
- **Frequency Capping**: Prevents ad fatigue with configurable limits
- **Viewability Tracking**: Industry-standard 50% visible for 1 second
- **Ad Transparency**: "Why this ad?" explanations for users
- **Policy Engine**: Content validation and category blocking
- **Real-time Analytics**: Impressions, CTR, viewability metrics
- **React Components**: Drop-in components for any FANZ property

## 📁 Project Structure

```
FANZForge/
├── openapi/
│   └── fanz-ads.yml              # OpenAPI 3.1 specification
├── services/
│   └── ad-service/               # Express.js ad service
│       ├── src/server.js         # Main server
│       ├── policy/rules.json     # Policy configuration
│       └── package.json
├── packages/
│   └── fanz-ads-client/          # React TypeScript library
│       ├── src/
│       │   ├── components/       # React components
│       │   ├── providers/        # Context providers
│       │   ├── utils/            # Utility functions
│       │   └── types.ts          # TypeScript definitions
│       └── package.json
├── env/
│   └── .env.local.template       # Environment template
└── .warp/
    └── workflows.yaml            # Warp automation workflows
```

## 🔧 Quick Start

### 1. Setup

```bash
# Initialize the project
warp run ads:setup

# Configure environment
cp env/.env.local.template env/.env.local
# Edit env/.env.local with your API keys
```

### 2. Development

```bash
# Start development server
warp run ads:dev

# In another terminal, test the API
warp run ads:test
```

### 3. Usage in React Apps

```jsx
import { FanzAdProvider, FanzAd } from '@fanz/ads-client';

function App() {
  return (
    <FanzAdProvider 
      platform="boyfanz" 
      apiBaseUrl="https://api.fanz.network"
      userHash="user123"
    >
      {/* Header ad */}
      <FanzAd placement="HEADER" platform="boyfanz" />
      
      {/* Sidebar ad */}
      <FanzAd placement="SIDEPANEL" platform="boyfanz" />
      
      {/* Homepage hero */}
      <FanzAd placement="HOMEPAGE_HERO" platform="boyfanz" />
    </FanzAdProvider>
  );
}
```

## 🔐 Payment Processors

**✅ Supported (Adult-Friendly)**
- CCBill
- Segpay  
- Epoch
- Vendo
- Verotel
- BitPay (crypto)
- Coinbase Commerce
- NOWPayments

**❌ Blocked**
- Stripe
- PayPal
- Square

## 📋 Ad Placements

| Placement | Dimensions | Usage |
|-----------|------------|-------|
| `HEADER` | 970×90, 728×90, 320×50 | Top of page banner |
| `FOOTER` | 728×90, 320×50 | Bottom banner |
| `SIDEPANEL` | 300×250, 300×600 | Sidebar ads |
| `HOMEPAGE_HERO` | 1200×400, 970×250 | Above-the-fold hero |
| `HOMEPAGE_NATIVE` | Responsive | In-content native ads |
| `DASHBOARD_WIDGET` | Responsive | Dashboard widgets |

## 🛠 API Endpoints

### Ad Serving
```http
GET /api/ads?placement=HEADER&platform=boyfanz&device=mobile
```

### Campaign Management
```http
POST /api/campaigns/init
POST /api/campaigns/{id}/creatives
POST /api/campaigns/{id}/activate
```

### Policy Validation
```http
POST /api/policy/validate
```

### Analytics & Transparency
```http
GET /api/ads/{id}/why
POST /api/analytics/events
```

## 📊 Analytics & Metrics

The system tracks comprehensive metrics:

- **Impressions**: Total ad views
- **Viewable Impressions**: Ads 50%+ visible for 1+ seconds
- **Clicks**: User interactions
- **CTR**: Click-through rate
- **Viewability Rate**: Percentage of viewable impressions
- **Revenue**: Optional revenue tracking

## 🔒 Security & Compliance

- **Content Policy**: Automated scanning for prohibited content
- **Payment Validation**: Blocks non-adult-friendly processors
- **Rate Limiting**: Prevents abuse and spam
- **HTML Sanitization**: Removes dangerous scripts and content
- **Frequency Capping**: User-based ad frequency limits
- **Geo Compliance**: Regional targeting and blocking

## 🎯 Targeting Options

- **Platform**: BoyFanz, GirlFanz, PupFanz, etc.
- **Device**: Mobile, tablet, desktop
- **Geography**: Country/region based
- **User Behavior**: Based on engagement patterns
- **Time**: Day/hour targeting
- **Categories**: Content category alignment

## 🧪 Testing

```bash
# Test all API endpoints
warp run ads:test

# Test campaign creation
warp run ads:campaign:test

# Test policy validation  
warp run ads:policy:test

# Build components
warp run ads:build
```

## 📦 Deployment

### Production Environment
```bash
# Build for production
npm run build

# Start service
NODE_ENV=production npm start
```

### Docker
```bash
# Build image
docker build -t fanz-ads .

# Run container
docker run -p 4000:4000 \
  -e NODE_ENV=production \
  -e CCBILL_API_KEY=your_key \
  fanz-ads
```

## 🔧 Configuration

Key environment variables:

```env
# Server
NODE_ENV=production
PORT=4000

# Adult-Friendly Payment Processors
CCBILL_API_KEY=your_ccbill_key
SEGPAY_API_KEY=your_segpay_key  
EPOCH_API_KEY=your_epoch_key
BITPAY_API_TOKEN=your_bitpay_token

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=1000
AD_RATE_LIMIT_MAX_REQUESTS=60

# Content Policy
MAX_CREATIVE_SIZE_IMAGE=200000
MAX_CREATIVE_SIZE_VIDEO=1500000
```

## 🐛 Troubleshooting

### Common Issues

**Port 4000 already in use**
```bash
warp run ads:stop
```

**Environment variables missing**
```bash
cp env/.env.local.template env/.env.local
# Edit with your keys
```

**Build failures**
```bash
warp run ads:clean
warp run ads:install
warp run ads:build
```

### Debug Mode

Enable debug logging:
```env
LOG_LEVEL=debug
DEBUG_MODE=true
```

## 📚 Documentation

- **OpenAPI Spec**: [openapi/fanz-ads.yml](openapi/fanz-ads.yml)
- **Policy Rules**: [services/ad-service/policy/rules.json](services/ad-service/policy/rules.json)
- **React Components**: [packages/fanz-ads-client/src/](packages/fanz-ads-client/src/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following our coding standards
4. Test thoroughly with `warp run ads:test`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

## 🎯 Roadmap

- [ ] Machine learning ad optimization
- [ ] Advanced fraud detection
- [ ] Video ad formats
- [ ] Real-time bidding (RTB)
- [ ] A/B testing framework
- [ ] Advanced analytics dashboard
- [ ] Mobile SDK (React Native)
- [ ] WordPress plugin

---

**Built with ❤️ for the FANZ ecosystem**