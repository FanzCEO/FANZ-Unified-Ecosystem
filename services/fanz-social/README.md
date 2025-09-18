# 🌐 FanzSocial - Social Networking Core Service

**Comprehensive social networking platform for the FANZ ecosystem with adult-content awareness and advanced privacy controls.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Redis](https://img.shields.io/badge/Redis-5.0+-red)](https://redis.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Overview

FanzSocial is a comprehensive social networking service designed specifically for the FANZ creator economy ecosystem. It provides advanced social networking features with built-in support for adult content, age verification, content gating, and sophisticated privacy controls.

### ✨ Key Features

- 👥 **User Management** - Complete user profiles with adult content settings
- 🔗 **Social Connections** - Follow, friend, and subscription relationships
- 📝 **Content Sharing** - Posts, stories, polls, and rich media support
- 🔒 **Privacy Controls** - Granular content visibility and access controls
- 🛡️ **Content Moderation** - AI-powered moderation with adult content awareness
- 📱 **Dynamic Feeds** - Personalized, algorithmic, and trending content feeds
- 🔔 **Notifications** - Real-time notification system
- 📈 **Analytics** - Comprehensive user and content analytics
- 🎯 **Discovery** - Smart user recommendations and trending content
- 🏷️ **Age Verification** - Built-in adult content age gating

## 🚀 Quick Start

### Installation

```bash
npm install @fanz/social-service
```

### Basic Usage

```typescript
import { FanzSocialService, SocialConfig, AccountType, ContentLevel } from '@fanz/social-service';

// Configure the service
const config: SocialConfig = {
  redis: {
    host: 'localhost',
    port: 6379,
    database: 10
  },
  moderation: {
    enableAI: true,
    autoApprove: true,
    strictMode: false
  },
  feeds: {
    algorithm: 'hybrid',
    refreshInterval: 300,
    maxFeedSize: 100
  }
};

// Initialize service
const fanzSocial = new FanzSocialService(config);

// Create a user
const user = await fanzSocial.createUser({
  username: 'creator_example',
  displayName: 'Example Creator',
  email: 'creator@example.com',
  clusterId: 'girlfanz',
  accountType: AccountType.CREATOR
});

// Create content
const post = await fanzSocial.createPost(user.id, {
  type: 'image',
  content: {
    text: 'Check out my latest photoshoot! 📸',
    hashtags: ['photography', 'art']
  },
  metadata: {
    contentLevel: ContentLevel.MATURE,
    ageRestricted: true
  }
});
```

## 📖 Documentation

### Core Concepts

#### User Types & Account Levels

```typescript
enum AccountType {
  FAN = 'fan',           // Regular users consuming content
  CREATOR = 'creator',   // Content creators
  PREMIUM = 'premium',   // Premium subscribers
  VIP = 'vip',          // VIP members
  MODERATOR = 'moderator', // Platform moderators
  ADMIN = 'admin'        // Platform administrators
}
```

#### Content Levels

```typescript
enum ContentLevel {
  GENERAL = 'general',      // All-ages content
  SUGGESTIVE = 'suggestive', // Mildly suggestive
  MATURE = 'mature',        // Adult themes but not explicit
  ADULT = 'adult',          // Adult content
  EXPLICIT = 'explicit',    // Sexually explicit content
  EXTREME = 'extreme'       // Extreme adult content
}
```

#### Connection Types

```typescript
enum ConnectionType {
  FOLLOW = 'follow',           // One-way following
  FRIEND = 'friend',           // Mutual friendship
  SUBSCRIBER = 'subscriber',   // Paid subscription
  BLOCK = 'block',            // Blocked user
  MUTE = 'mute',              // Muted user
  FAVORITE = 'favorite',      // Favorited creator
  CLOSE_FRIEND = 'close_friend' // Close friend relationship
}
```

### User Management

#### Creating Users

```typescript
const creator = await fanzSocial.createUser({
  username: 'luna_starlight',
  displayName: 'Luna Starlight ✨',
  email: 'luna@example.com',
  clusterId: 'girlfanz',
  accountType: AccountType.CREATOR,
  bio: '✨ Premium content creator | 21+ | Custom videos available',
  profile: {
    interests: ['photography', 'fitness', 'fashion'],
    contentPreferences: [
      { category: 'photos', level: ContentLevel.ADULT, enabled: true },
      { category: 'videos', level: ContentLevel.EXPLICIT, enabled: true }
    ],
    lookingFor: ['fans', 'subscribers']
  }
});
```

#### User Search & Discovery

```typescript
// Search users by criteria
const creators = await fanzSocial.searchUsers({
  clusterId: 'girlfanz',
  accountType: AccountType.CREATOR,
  verified: true,
  interests: ['photography'],
  limit: 10
});

// Get recommended users
const recommendations = await fanzSocial.getRecommendedUsers(userId, 10);
```

### Social Connections

#### Creating Connections

```typescript
// Follow a user
await fanzSocial.createConnection(fanId, creatorId, ConnectionType.FOLLOW);

// Subscribe with metadata
await fanzSocial.createConnection(fanId, creatorId, ConnectionType.SUBSCRIBER, {
  subscriptionLevel: 'premium',
  subscriptionPrice: 29.99,
  subscriptionDuration: 30
});

// Send friend request
await fanzSocial.createConnection(user1Id, user2Id, ConnectionType.FRIEND);
```

#### Managing Connections

```typescript
// Get user's connections
const followers = await fanzSocial.getConnections(userId, ConnectionType.FOLLOW);
const subscribers = await fanzSocial.getConnections(userId, ConnectionType.SUBSCRIBER);

// Remove connection
await fanzSocial.removeConnection(fromUserId, toUserId, ConnectionType.FOLLOW);
```

### Content Management

#### Creating Posts

```typescript
// Text post
const textPost = await fanzSocial.createPost(authorId, {
  type: PostType.TEXT,
  content: {
    text: 'Hello everyone! 👋',
    hashtags: ['greeting', 'community']
  }
});

// Image post with media
const imagePost = await fanzSocial.createPost(authorId, {
  type: PostType.IMAGE,
  content: {
    text: 'New photoshoot! 📸',
    hashtags: ['photography', 'art'],
    media: [{
      id: 'photo_001',
      type: 'image',
      url: 'https://cdn.example.com/photo.jpg',
      size: 2048000,
      format: 'jpg',
      quality: 'hd'
    }]
  },
  metadata: {
    contentLevel: ContentLevel.MATURE,
    ageRestricted: true,
    requiresSubscription: false
  }
});

// Premium subscription-only content
const premiumPost = await fanzSocial.createPost(authorId, {
  type: PostType.VIDEO,
  content: {
    text: 'Exclusive content for subscribers! 🔥',
    media: [/* video media */]
  },
  metadata: {
    contentLevel: ContentLevel.EXPLICIT,
    ageRestricted: true,
    requiresSubscription: true,
    price: 15.99
  },
  visibility: 'subscribers_only'
});
```

#### Post Interactions

```typescript
// Like a post
await fanzSocial.likePost(postId, userId);

// Add comment
const comment = await fanzSocial.addComment(postId, userId, 'Great content! 👍');

// Share post
const sharePost = await fanzSocial.sharePost(postId, userId, 'Check this out!');
```

### Stories

#### Creating Stories

```typescript
// Photo story
const photoStory = await fanzSocial.createStory(authorId, {
  type: StoryType.PHOTO,
  content: {
    media: {
      id: 'story_001',
      type: 'image',
      url: 'https://cdn.example.com/story.jpg',
      size: 1024000,
      format: 'jpg'
    },
    text: 'Behind the scenes! ✨',
    stickers: [
      {
        id: 'location_sticker',
        type: 'location',
        x: 50, y: 80,
        data: { name: 'Los Angeles' }
      }
    ]
  },
  visibility: 'followers'
});

// View story
await fanzSocial.viewStory(storyId, viewerId);

// Get user's stories
const stories = await fanzSocial.getUserStories(userId);
```

### Feed Management

#### Feed Types

```typescript
enum FeedType {
  HOME = 'home',              // Personalized home feed
  FOLLOWING = 'following',    // Posts from followed users
  DISCOVER = 'discover',      // Discovery/explore feed
  TRENDING = 'trending',      // Trending content
  LOCAL = 'local',           // Local area content
  CLUSTER = 'cluster',       // Cluster-specific content
  PERSONALIZED = 'personalized' // AI-personalized feed
}
```

#### Getting Feeds

```typescript
// Get user's home feed
const homeFeed = await fanzSocial.getUserFeed(userId, FeedType.HOME, 20);

// Get discovery feed
const discoverFeed = await fanzSocial.getUserFeed(userId, FeedType.DISCOVER, 15);

// Get trending content
const trendingFeed = await fanzSocial.getUserFeed(userId, FeedType.TRENDING, 10);
```

### Notifications

#### Managing Notifications

```typescript
// Send notification
await fanzSocial.sendNotification({
  recipientId: userId,
  type: NotificationType.LIKE,
  title: 'New Like',
  message: 'Someone liked your post',
  data: { postId: 'post_123', actorId: 'user_456' }
});

// Get user notifications
const notifications = await fanzSocial.getUserNotifications(userId, 20);

// Mark as read
await fanzSocial.markNotificationAsRead(notificationId);
```

### Trending & Discovery

#### Trending Analysis

```typescript
// Get trending hashtags globally
const globalTrends = await fanzSocial.getTrendingHashtags();

// Get trending hashtags for specific cluster
const clusterTrends = await fanzSocial.getTrendingHashtags('girlfanz');

// Results include engagement metrics
trends.forEach(trend => {
  console.log(`#${trend.content}`, {
    mentions: trend.stats.mentions,
    posts: trend.stats.posts,
    growth: trend.stats.growth
  });
});
```

### Privacy & Content Controls

#### Privacy Settings

```typescript
// Update user privacy settings
await fanzSocial.updateUser(userId, {
  settings: {
    privacy: {
      profileVisibility: ProfileVisibility.FOLLOWERS_ONLY,
      messagePermissions: MessagePermissions.SUBSCRIBERS,
      followPermissions: FollowPermissions.REQUIRES_APPROVAL,
      contentVisibility: ContentVisibility.SUBSCRIBERS_ONLY,
      showInRecommendations: false
    }
  }
});
```

#### Content Filtering

```typescript
// Update content preferences
await fanzSocial.updateUser(userId, {
  profile: {
    contentPreferences: [
      { category: ContentCategory.PHOTOS, level: ContentLevel.MATURE, enabled: true },
      { category: ContentCategory.VIDEOS, level: ContentLevel.ADULT, enabled: true },
      { category: ContentCategory.LIVE_STREAMS, level: ContentLevel.GENERAL, enabled: false }
    ]
  }
});
```

## 🔧 Configuration

### Service Configuration

```typescript
interface SocialConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    database?: number;
  };
  moderation: {
    enableAI: boolean;        // Enable AI content moderation
    autoApprove: boolean;     // Auto-approve low-risk content
    strictMode: boolean;      // Strict moderation mode
  };
  feeds: {
    algorithm: FeedAlgorithm; // Feed generation algorithm
    refreshInterval: number;  // Feed refresh interval (seconds)
    maxFeedSize: number;      // Maximum posts per feed
  };
  content: {
    maxImageSize: number;     // Max image size in bytes
    maxVideoSize: number;     // Max video size in bytes
    allowedFormats: string[]; // Allowed file formats
  };
  features: {
    enableStories: boolean;      // Enable stories feature
    enableLiveStreaming: boolean; // Enable live streaming
    enablePolls: boolean;        // Enable polls
    enableGifts: boolean;        // Enable virtual gifts
  };
}
```

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DATABASE=10

# Service Configuration
SOCIAL_MODERATION_AI=true
SOCIAL_AUTO_APPROVE=true
SOCIAL_STRICT_MODE=false

# Content Configuration
MAX_IMAGE_SIZE=10485760      # 10MB
MAX_VIDEO_SIZE=104857600     # 100MB
ALLOWED_FORMATS=jpg,png,gif,mp4,webm

# Feature Flags
ENABLE_STORIES=true
ENABLE_LIVE_STREAMING=true
ENABLE_POLLS=true
ENABLE_GIFTS=true
```

## 🧪 Development

### Running the Demo

```bash
# Install dependencies
npm install

# Run the demo
npm run demo
```

The demo showcases:
- User creation across different FANZ clusters
- Social connections and relationships
- Content creation with various adult content levels
- Story management
- Feed generation and curation
- User interactions and engagement
- Trending analysis
- Privacy controls and content filtering

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Building

```bash
# Build the project
npm run build

# Build and watch for changes
npm run build:watch

# Development mode with hot reload
npm run dev
```

## 📊 Performance & Scaling

### Redis Storage Strategy

FanzSocial uses Redis for high-performance caching and data storage:

- **Users**: `user:{userId}` - User profiles and settings
- **Posts**: `post:{postId}` - Post content and metadata
- **Connections**: `connection:{connectionId}` - Social relationships
- **Feeds**: `feed:{userId}:{feedType}` - Generated user feeds
- **Stories**: `story:{storyId}` - Temporary story content (24h TTL)
- **Notifications**: `user:{userId}:notifications` - User notification queue
- **Trending**: `trends:hashtags:{cluster}` - Trending hashtag scores

### Background Workers

The service includes several background workers:

- **Feed Generator**: Refreshes user feeds every 5 minutes
- **Trending Analyzer**: Updates trending hashtags every 15 minutes
- **Recommendation Engine**: Updates user recommendations every hour
- **Moderation Worker**: Processes flagged content every 2 minutes
- **Analytics Worker**: Updates user engagement stats every 30 minutes

### Memory Management

- **User Cache**: Active users kept in memory with LRU eviction
- **Post Cache**: Recent posts cached for fast feed generation
- **Connection Cache**: Social graphs cached for recommendation algorithms

## 🔒 Security & Compliance

### Adult Content Protection

- **Age Verification**: Built-in age verification requirements
- **Content Gating**: Automatic age-restricted content filtering
- **Parental Controls**: Support for parental control systems
- **Geographic Compliance**: Region-based content restrictions

### Privacy Features

- **Data Minimization**: Only collect necessary user data
- **User Consent**: Granular consent management for data processing
- **Right to Deletion**: Complete user data removal capabilities
- **Data Portability**: Export user data in standardized formats

### Content Moderation

- **AI Moderation**: Automated content safety analysis
- **Human Review**: Flagged content reviewed by moderators
- **User Reporting**: Community-driven content reporting system
- **Appeal Process**: Content moderation appeal workflow

## 🤝 Integration

### FANZ Ecosystem Integration

FanzSocial integrates seamlessly with other FANZ services:

- **CreatorCRM**: User lifecycle and relationship management
- **FanzDash**: Administrative control and monitoring
- **MediaCore**: Media processing and CDN integration
- **FanzFinance**: Subscription and payment processing
- **FanzProtect**: Security and fraud prevention

### API Integration

```typescript
// Example integration with other services
import { FanzSocialService } from '@fanz/social-service';
import { CreatorCRMService } from '@fanz/creator-crm-service';

const social = new FanzSocialService(config);
const crm = new CreatorCRMService(crmConfig);

// Cross-service event handling
social.on('user_created', async (user) => {
  await crm.trackCreatorActivity(user.id, 'profile_created');
});

social.on('post_created', async (post) => {
  if (post.metadata.requiresSubscription) {
    await crm.trackRevenueOpportunity(post.authorId, post.metadata.price);
  }
});
```

## 📈 Analytics & Monitoring

### User Analytics

```typescript
// Get comprehensive user stats
const user = await fanzSocial.getUser(userId);
console.log({
  followers: user.stats.followers,
  engagement: user.stats.engagement.engagementRate,
  revenue: user.stats.revenue
});
```

### Content Performance

```typescript
// Analyze post performance
const posts = await fanzSocial.getUserPosts(creatorId, 50);
const avgEngagement = posts.reduce((sum, post) => {
  return sum + (post.engagement.likes + post.engagement.comments);
}, 0) / posts.length;
```

### Platform Metrics

- **Daily Active Users (DAU)**
- **Monthly Active Users (MAU)**
- **Content Creation Rate**
- **Engagement Metrics**
- **Revenue Attribution**
- **Retention Rates**

## 🚀 Deployment

### Production Setup

```bash
# Install in production
npm ci --production

# Build the service
npm run build

# Start the service
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Kubernetes Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fanz-social
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fanz-social
  template:
    spec:
      containers:
      - name: fanz-social
        image: fanz/social-service:latest
        env:
        - name: REDIS_HOST
          value: "redis-service"
        - name: REDIS_PORT
          value: "6379"
```

## 🎯 Roadmap

### Planned Features

- [ ] **Advanced AI Moderation** - Enhanced AI content analysis
- [ ] **Live Streaming Integration** - Real-time streaming support  
- [ ] **NFT Integration** - Creator NFT marketplace
- [ ] **Advanced Analytics** - Machine learning insights
- [ ] **Mobile SDK** - Native mobile app integration
- [ ] **Blockchain Features** - Decentralized social features
- [ ] **VR/AR Support** - Metaverse content creation
- [ ] **Multi-language Support** - Global localization

### Performance Improvements

- [ ] **GraphQL API** - Efficient data fetching
- [ ] **CDN Integration** - Global content delivery
- [ ] **Microservice Split** - Service decomposition
- [ ] **Real-time Subscriptions** - WebSocket support
- [ ] **Edge Computing** - Distributed processing

## 🆘 Support

### Documentation

- [API Reference](./docs/api-reference.md)
- [Integration Guide](./docs/integration.md)
- [Best Practices](./docs/best-practices.md)

### Community

- [GitHub Issues](https://github.com/joshuastone/FANZ-Unified-Ecosystem/issues)
- [Discord Community](https://discord.gg/fanz-dev)
- [Developer Forum](https://forum.fanz.dev)

### Contact

- **Email**: dev@fanz.com  
- **Support**: support@fanz.com
- **Security**: security@fanz.com

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with ❤️ by the FANZ Engineering Team for the creator economy.

- [Redis](https://redis.io/) - High-performance data storage
- [TypeScript](https://www.typescriptlang.org/) - Type-safe development
- [Node.js](https://nodejs.org/) - Runtime environment

---

**🌐 FanzSocial - Empowering the creator economy with advanced social networking.**