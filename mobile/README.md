# 📱 FANZ Mobile App - React Native

> **FANZ Mobile**: The ultimate creator economy mobile app for iOS and Android, featuring live streaming, NFT marketplace, Web3 integration, and adult-friendly payment processing.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- React Native CLI
- Xcode (for iOS development)
- Android Studio (for Android development)
- CocoaPods (for iOS dependencies)

### Installation

```bash
# Clone the repository
git clone https://github.com/FanzCEO/FANZ-Unified-Ecosystem.git
cd FANZ_UNIFIED_ECOSYSTEM/mobile

# Install dependencies
npm install

# iOS setup
cd ios && pod install && cd ..

# Copy environment configuration
cp .env.example .env
# Edit .env with your actual configuration values
```

### Development

```bash
# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android  
npm run android

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Code formatting
npm run format
```

## 🏗️ Project Structure

```
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # App screens/pages
│   ├── services/           # API services, utilities
│   ├── navigation/         # Navigation configuration
│   ├── store/              # Redux store and slices
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Helper functions
│   ├── constants/          # App constants
│   ├── types/              # TypeScript type definitions
│   ├── assets/             # Images, fonts, etc.
│   ├── config/             # App configuration
│   └── FanzMobileApp.tsx   # Main app component
├── android/                # Android native code
├── ios/                    # iOS native code
├── __tests__/              # Test files
├── e2e/                    # End-to-end tests
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── babel.config.js         # Babel configuration
├── metro.config.js         # Metro bundler configuration
└── README.md               # This file
```

## 🎯 Key Features

### 🎬 Content & Media
- **Video Streaming**: Live and on-demand content
- **Media Upload**: Photos, videos with compression
- **Content Moderation**: AI-powered moderation
- **Multi-format Support**: MP4, WebM, JPEG, PNG, GIF

### 💰 Payment Processing
- **Adult-Friendly Processors**: CCBill, Paxum, Segpay integration
- **Subscription Management**: Tiered creator subscriptions
- **In-App Purchases**: Tips, premium content access
- **Wallet Integration**: Crypto and fiat support

### 🔗 Web3 & NFT
- **NFT Marketplace**: Create, buy, sell NFTs
- **Wallet Connect**: Multi-wallet support
- **Blockchain Integration**: Ethereum, Polygon networks
- **Smart Contracts**: Automated royalty distribution

### 📱 Mobile Experience
- **Biometric Authentication**: Face ID, Touch ID, Fingerprint
- **Push Notifications**: Real-time engagement alerts
- **Offline Support**: Content caching and sync
- **Platform Themes**: Customizable UI per platform (BoyFanz, GirlFanz, etc.)

### 🤖 AI Features
- **Content Intelligence**: Auto-tagging, recommendations
- **Chat AI**: FanzGPT integration for creators
- **Content Generation**: AI-assisted content creation
- **Analytics**: AI-powered insights and metrics

## 🛠️ Development Workflow

### 🔧 Environment Setup

1. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

2. **Firebase Setup**
   - Add `google-services.json` to `android/app/`
   - Add `GoogleService-Info.plist` to `ios/`

3. **Native Dependencies**
   ```bash
   # iOS
   cd ios && pod install
   
   # Android - dependencies auto-installed
   ```

### 🎨 Platform Themes

Each FANZ platform has its own theme:

```typescript
const platformThemes = {
  girlfanz: { primary: '#FF0080', name: 'Neon Pink' },
  boyfanz: { primary: '#FF0040', name: 'Neon Red' },
  daddyfanz: { primary: '#FFD700', name: 'Gold' },
  pupfanz: { primary: '#00FF40', name: 'Neon Green' },
  taboofanz: { primary: '#0040FF', name: 'Dark Neon Blue' },
  transfanz: { primary: '#00FFFF', name: 'Turquoise' },
  cougarfanz: { primary: '#FFAA00', name: 'Mature Gold' },
  fanzcock: { primary: '#FF0000', name: 'XXX Red' }
};
```

### 🧪 Testing

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests (requires setup)
npm run test:e2e:ios
npm run test:e2e:android
```

### 🚀 Building & Deployment

```bash
# Development build
npm run build:dev

# Production builds
npm run build:android
npm run build:ios

# Bundle analysis
npm run bundle:android
npm run bundle:ios
```

## 🔌 API Integration

### Backend Connection
```typescript
const API_CONFIG = {
  baseURL: process.env.API_BASE_URL || 'https://api.fanz.app',
  timeout: 10000,
  retries: 3
};
```

### GraphQL Integration
```typescript
import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
  uri: process.env.GRAPHQL_ENDPOINT,
  cache: new InMemoryCache(),
});
```

### WebSocket Real-time
```typescript
const wsConnection = new WebSocket(process.env.WEBSOCKET_URL);
```

## 🛡️ Security & Compliance

### Age Verification
- Mandatory age verification for adult content
- Document verification integration
- Geo-location restrictions

### Data Protection
- End-to-end encryption for sensitive data
- Biometric authentication
- Secure token storage with Keychain/Keystore

### Compliance Features
- 2257 record keeping compliance
- Content rating system
- Privacy controls and data deletion

## 📊 Analytics & Monitoring

### Integrated Analytics
- **Firebase Analytics**: User behavior tracking
- **Crashlytics**: Crash reporting and analysis
- **Sentry**: Error monitoring and performance
- **Custom Events**: Creator-specific metrics

### Performance Monitoring
- React Native Performance monitor
- Network request tracking
- Memory usage optimization
- Battery usage optimization

## 🌐 Internationalization

Currently supports:
- English (default)
- Spanish
- French
- German
- Japanese

Add new languages in `src/locales/`

## 🔄 State Management

Using Redux Toolkit with persistence:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';

const store = configureStore({
  reducer: {
    auth: authSlice,
    user: userSlice,
    content: contentSlice,
    payments: paymentsSlice,
    nft: nftSlice,
  },
});
```

## 🚨 Troubleshooting

### Common Issues

#### Metro bundler issues
```bash
npm run clean
npm start -- --reset-cache
```

#### iOS build issues
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
```

#### Android build issues
```bash
cd android
./gradlew clean
cd .. && npm run android
```

#### Environment variable issues
```bash
# Verify .env file exists and has correct values
cat .env | grep API_BASE_URL
```

### Debug Menu
- iOS: Cmd + D
- Android: Cmd + M (Mac) or Ctrl + M (Windows/Linux)

## 📚 Additional Resources

### Documentation
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Firebase React Native](https://rnfirebase.io/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [React Navigation](https://reactnavigation.org/)

### FANZ Ecosystem Integration
- Backend API Documentation: `../backend/README.md`
- Web Platform: `../frontend/README.md`
- Payment Processing: `../docs/payment-processors-guide.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Create a Pull Request

### Code Standards
- Follow TypeScript best practices
- Use functional components with hooks
- Write comprehensive tests
- Follow the established folder structure
- Use meaningful commit messages

## 📄 License

This project is proprietary software owned by FANZ. All rights reserved.

## 📞 Support

- **Development Issues**: Create an issue in the repository
- **Integration Questions**: Check the API documentation
- **Security Concerns**: Contact the security team

---

**🚀 Ready to build the future of creator economy on mobile?**

*Experience the complete FANZ ecosystem with features designed specifically for adult content creators and their communities.*