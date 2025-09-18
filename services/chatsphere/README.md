# 💬 ChatSphere - Real-Time Communication Service

## Overview

ChatSphere is a comprehensive real-time communication service for the FANZ ecosystem, providing advanced messaging, video/audio calling, and content moderation capabilities across all platform clusters. Built with WebSocket and WebRTC technologies, it supports everything from private conversations to large-scale live streaming chats.

## 🌟 Features

### Core Messaging
- **Real-time messaging** with WebSocket connections
- **Message types**: Text, images, videos, audio, files, stickers, gifts, tips
- **Message reactions** and emoji support
- **Read receipts** and delivery confirmations
- **Message encryption** for private conversations
- **Message editing** and deletion
- **Reply and forward** functionality
- **Mention and hashtag** support

### Video & Audio Calling
- **WebRTC-based** peer-to-peer calling
- **Voice and video calls** with HD quality
- **Group video conferencing** (up to 50 participants)
- **Screen sharing** capabilities
- **Call recording** and playback
- **Adaptive bitrate streaming** for optimal quality
- **Call quality monitoring** with real-time metrics
- **Automatic reconnection** on network issues

### Chat Rooms & Communities
- **Private 1-on-1** conversations
- **Group chats** with unlimited participants
- **Broadcast channels** for creator-to-fan communication
- **Live stream chat** integration
- **Community forums** and discussion rooms
- **Custom room settings** and permissions

### Content Moderation
- **Multi-level moderation** (None, Low, Medium, High, Strict)
- **AI-powered content filtering** 
- **Adult content detection** and age-gating
- **Spam and toxicity detection**
- **User reporting system**
- **Automated moderation actions**
- **Content level restrictions** per platform cluster

### Cross-Platform Support
- **9 Platform Clusters** with specialized themes:
  - FanzLab (Universal Portal)
  - BoyFanz, GirlFanz, TransFanz
  - DaddyFanz, PupFanz, CougarFanz
  - TabooFanz, FanzCock
- **Content level filtering** (General, Mature, Adult, Extreme)
- **Platform-specific features** and restrictions

### Advanced Features
- **Presence indicators** (Online, Away, Busy, Invisible)
- **Custom status messages** and activities
- **Message translation** and accessibility
- **File sharing** with virus scanning
- **Gift and tip system** integration
- **Analytics and insights** for creators
- **Custom reactions** and stickers

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ChatSphere Service                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   WebSocket     │  │    WebRTC       │  │   REST API      │ │
│  │   Server        │  │   Service       │  │   Endpoints     │ │
│  │                 │  │                 │  │                 │ │
│  │ • Real-time     │  │ • Video/Audio   │  │ • Room mgmt     │ │
│  │   messaging     │  │   calling       │  │ • User mgmt     │ │
│  │ • Room mgmt     │  │ • Screen share  │  │ • Analytics     │ │
│  │ • Presence      │  │ • Recording     │  │ • Moderation    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    Core Services Layer                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Message       │  │   Moderation    │  │    Quality      │ │
│  │   Processing    │  │   Engine        │  │   Monitoring    │ │
│  │                 │  │                 │  │                 │ │
│  │ • Validation    │  │ • AI filtering  │  │ • Call metrics  │ │
│  │ • Encryption    │  │ • User reports  │  │ • Network stats │ │
│  │ • Media proc.   │  │ • Auto actions  │  │ • Performance   │ │
│  │ • Persistence   │  │ • Compliance    │  │ • Alerting      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                     Data Layer                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │     Redis       │  │   PostgreSQL    │  │   File Store    │ │
│  │                 │  │                 │  │                 │ │
│  │ • Real-time     │  │ • Messages      │  │ • Media files   │ │
│  │   caching       │  │ • Users/Rooms   │  │ • Recordings    │ │
│  │ • Pub/Sub       │  │ • Analytics     │  │ • Thumbnails    │ │
│  │ • Sessions      │  │ • Reports       │  │ • Backups       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Redis 6+
- PostgreSQL 13+
- Docker (optional)

### Installation

```bash
# Clone repository
git clone https://github.com/joshuastone/FANZ-Unified-Ecosystem.git
cd FANZ_UNIFIED_ECOSYSTEM/services/chatsphere

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Build project
npm run build

# Start development server
npm run dev
```

### Docker Setup

```bash
# Start with Docker Compose
docker-compose up -d

# Or build and run manually
docker build -t chatsphere .
docker run -p 3003:3003 chatsphere
```

## ⚙️ Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3003
HOST=0.0.0.0
NODE_ENV=development

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_CHATSPHERE_DB=8

# Security Settings
ENABLE_ENCRYPTION=true
ENABLE_MODERATION=true
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=24h

# Feature Toggles
ENABLE_VOICE_CALLS=true
ENABLE_VIDEO_CALLS=true
ENABLE_SCREEN_SHARE=true
ENABLE_FILE_SHARING=true
ENABLE_GIFTS=true
ENABLE_TIPS=true
ENABLE_CALL_RECORDING=true

# Moderation Settings
ENABLE_AI_MODERATION=true
DEFAULT_MODERATION_LEVEL=medium
MAX_REPORTS_PER_USER=10
AUTO_MODERATION_THRESHOLD=0.8

# Performance Settings
MAX_MESSAGE_LENGTH=10000
MAX_FILE_SIZE=104857600
MAX_CLIENTS_PER_INSTANCE=10000
HEARTBEAT_INTERVAL=30000

# WebRTC Configuration
STUN_SERVER=stun:stun.l.google.com:19302
TURN_SERVER=turn:your-turn-server.com:3478
TURN_USERNAME=username
TURN_CREDENTIAL=password

# Monitoring
ENABLE_METRICS=true
ENABLE_HEALTH_CHECKS=true
METRICS_PORT=9090

# External Services
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 🔌 WebSocket API

### Connection

Connect to the WebSocket endpoint:

```javascript
const ws = new WebSocket('ws://localhost:3003/chatsphere');

// Set authentication headers
ws.send(JSON.stringify({
  type: 'authenticate',
  data: {
    token: 'jwt-token',
    userId: 'user123',
    clusterId: 'fanzlab'
  }
}));
```

### Message Types

#### Send Message

```javascript
{
  type: 'send_message',
  data: {
    roomId: 'room123',
    content: {
      text: 'Hello world!',
      mediaUrl: 'https://example.com/image.jpg',
      mediaType: 'image/jpeg'
    },
    type: 'text',
    replyToId: 'msg456',
    tempId: 'temp123'
  }
}
```

#### Join Room

```javascript
{
  type: 'join_room',
  data: {
    roomId: 'room123'
  }
}
```

#### Start Call

```javascript
{
  type: 'start_call',
  data: {
    roomId: 'room123',
    type: 'video',
    participants: ['user456', 'user789']
  }
}
```

#### Update Presence

```javascript
{
  type: 'update_presence',
  data: {
    status: 'online',
    activity: 'Streaming live',
    customStatus: '💻 Working on new content'
  }
}
```

### Server Events

#### New Message

```javascript
{
  type: 'new_message',
  data: {
    id: 'msg123',
    roomId: 'room123',
    senderId: 'user456',
    content: { text: 'Hello!' },
    createdAt: '2024-01-01T12:00:00Z'
  }
}
```

#### Call Invitation

```javascript
{
  type: 'call_invite',
  data: {
    callId: 'call123',
    roomId: 'room123',
    initiator: 'user456',
    type: 'video'
  }
}
```

## 🌐 REST API

### Rooms

```bash
# Get room info
GET /api/rooms/:roomId

# Create room
POST /api/rooms
{
  "type": "group",
  "name": "My Room",
  "description": "A cool room",
  "settings": {
    "isPublic": false,
    "maxParticipants": 100,
    "contentLevel": "mature"
  }
}

# Update room
PUT /api/rooms/:roomId
{
  "name": "Updated Room Name",
  "description": "New description"
}

# Delete room
DELETE /api/rooms/:roomId
```

### Messages

```bash
# Get room messages
GET /api/rooms/:roomId/messages?limit=50&before=msgId

# Get message details
GET /api/messages/:messageId

# Delete message
DELETE /api/messages/:messageId

# React to message
POST /api/messages/:messageId/reactions
{
  "emoji": "👍"
}
```

### Users & Presence

```bash
# Get user presence
GET /api/users/:userId/presence

# Update presence
PUT /api/users/:userId/presence
{
  "status": "away",
  "customStatus": "Be back soon!"
}

# Get online users in room
GET /api/rooms/:roomId/participants/online
```

### Calls

```bash
# Get call details
GET /api/calls/:callId

# Get user's active calls
GET /api/users/:userId/calls

# Get call recording
GET /api/calls/:callId/recording

# Start call recording
POST /api/calls/:callId/recording

# Stop call recording
DELETE /api/calls/:callId/recording
```

### Moderation

```bash
# Report user/message
POST /api/moderation/reports
{
  "targetType": "message",
  "targetId": "msg123",
  "reason": "spam",
  "description": "This is spam content"
}

# Get moderation actions
GET /api/moderation/actions

# Moderate user
POST /api/moderation/actions
{
  "userId": "user123",
  "roomId": "room123",
  "action": "mute",
  "duration": 3600,
  "reason": "Violation of community guidelines"
}
```

## 🛡️ Adult Content & Compliance

### Content Levels

- **General**: Safe for all audiences
- **Mature**: Adult themes, no explicit content
- **Adult**: Explicit sexual content
- **Extreme**: Extreme adult content

### Age Verification

```javascript
// Check user age verification
GET /api/users/:userId/verification

// Age gate before adult content access
{
  "contentLevel": "adult",
  "verificationRequired": true,
  "minAge": 18,
  "geoRestrictions": ["US", "EU"]
}
```

### Geographic Restrictions

Content access is restricted based on:
- User location (IP geolocation)
- Local laws and regulations
- Platform-specific restrictions
- Age verification requirements

### USC 2257 Compliance

For adult content creators:
- Mandatory age verification records
- Model identification and consent
- Content categorization and labeling
- Audit trail and record keeping

## 📊 Monitoring & Analytics

### Metrics Endpoint

```bash
# Prometheus metrics
GET /metrics

# Health check
GET /health

# Service readiness
GET /ready
```

### Key Metrics

- **Active connections**: Real-time WebSocket connections
- **Messages per second**: Message throughput
- **Call quality**: Audio/video call metrics
- **Moderation actions**: Content moderation stats
- **Error rates**: Service error monitoring
- **Response times**: API performance metrics

### Performance Monitoring

```bash
# Real-time metrics
curl http://localhost:3003/api/metrics/realtime

# Call quality stats
curl http://localhost:3003/api/metrics/calls

# Moderation effectiveness
curl http://localhost:3003/api/metrics/moderation
```

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Integration Tests

```bash
# Test WebSocket connections
npm run test:websocket

# Test WebRTC functionality
npm run test:webrtc

# Test moderation system
npm run test:moderation
```

### Load Testing

```bash
# Simulate concurrent connections
npm run test:load:connections

# Message throughput testing
npm run test:load:messages

# Call quality under load
npm run test:load:calls
```

## 🚀 Deployment

### Docker Production

```bash
# Build production image
docker build -f Dockerfile.prod -t chatsphere:prod .

# Run with production config
docker run -d \
  --name chatsphere \
  -p 3003:3003 \
  -e NODE_ENV=production \
  -e REDIS_HOST=redis.example.com \
  chatsphere:prod
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chatsphere
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chatsphere
  template:
    metadata:
      labels:
        app: chatsphere
    spec:
      containers:
      - name: chatsphere
        image: chatsphere:prod
        ports:
        - containerPort: 3003
        env:
        - name: NODE_ENV
          value: "production"
        - name: REDIS_HOST
          value: "redis-service"
```

### Load Balancer Setup

```nginx
upstream chatsphere {
    ip_hash;  # Sticky sessions for WebSocket
    server app1.example.com:3003;
    server app2.example.com:3003;
    server app3.example.com:3003;
}

server {
    listen 80;
    server_name chat.fanz.com;

    location / {
        proxy_pass http://chatsphere;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔐 Security

### Authentication

- JWT token-based authentication
- Refresh token rotation
- Session management with Redis
- Multi-factor authentication support

### Data Protection

- End-to-end encryption for private messages
- TLS 1.3 for all connections
- Message encryption at rest
- PII data anonymization

### Rate Limiting

```javascript
// Per-user rate limits
{
  messages: "100/minute",
  calls: "10/hour", 
  reports: "5/hour",
  fileUploads: "20/hour"
}
```

### Content Security

- XSS protection with CSP headers
- File upload scanning
- Media content analysis
- Malware detection

## 🎯 Performance Optimization

### Horizontal Scaling

- Stateless service design
- Redis pub/sub for inter-service communication
- Sticky sessions for WebSocket connections
- Database read replicas

### Caching Strategy

- Redis for real-time data
- CDN for media files
- Application-level caching
- Query result optimization

### WebRTC Optimization

- TURN server clustering
- Adaptive bitrate streaming
- Network quality adaptation
- Bandwidth management

## 🐛 Troubleshooting

### Common Issues

#### WebSocket Connection Fails

```bash
# Check server status
curl http://localhost:3003/health

# Verify WebSocket endpoint
wscat -c ws://localhost:3003/chatsphere

# Check authentication
curl -H "Authorization: Bearer <token>" \
     http://localhost:3003/api/auth/verify
```

#### WebRTC Call Issues

```bash
# Test STUN/TURN servers
npm run test:stun-turn

# Check firewall settings
netstat -an | grep 3003

# Verify ICE candidates
curl http://localhost:3003/api/webrtc/ice-candidates
```

#### Performance Issues

```bash
# Monitor Redis performance
redis-cli --latency-history

# Check memory usage
curl http://localhost:3003/api/metrics/memory

# Monitor connection count
curl http://localhost:3003/api/metrics/connections
```

## 📚 Documentation

- [API Reference](./docs/api-reference.md)
- [WebSocket Events](./docs/websocket-events.md)
- [WebRTC Implementation](./docs/webrtc-guide.md)
- [Moderation Guide](./docs/moderation.md)
- [Deployment Guide](./docs/deployment.md)
- [Security Best Practices](./docs/security.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Write comprehensive tests
- Update documentation
- Follow semantic versioning
- Maintain backward compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.fanz.com/chatsphere](https://docs.fanz.com/chatsphere)
- **Issues**: [GitHub Issues](https://github.com/joshuastone/FANZ-Unified-Ecosystem/issues)
- **Discord**: [FANZ Developer Community](https://discord.gg/fanz-dev)
- **Email**: engineering@fanz.com

---

**Built with ❤️ by the FANZ Engineering Team**

*ChatSphere powers real-time communication for millions of creators and fans worldwide.*