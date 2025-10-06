# 📡 FANZ Platform - API Documentation

Complete API reference and integration guide for the FANZ Unified Ecosystem creator economy platform.

## 🚀 Quick Start

### Base URLs
- **Production**: `https://api.fanz.com/v1`
- **Staging**: `https://api-staging.fanz.com/v1`
- **Sandbox**: `https://api-sandbox.fanz.com/v1`

### Authentication

All API requests require authentication using JWT tokens:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Get Access Token

```bash
curl -X POST https://api.fanz.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your_password"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "{{JWT_TOKEN}}",
    "refresh_token": "{{REFRESH_TOKEN}}",
    "expires_in": 86400,
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "role": "creator",
      "verified": true
    }
  }
}
```

## 📚 API Endpoints

### 👤 Authentication & Users

#### Register New User
```http
POST /auth/register
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "username": "myusername",
  "role": "creator", // "creator", "fan", "admin"
  "profile": {
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1990-01-01",
    "bio": "Content creator passionate about technology"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "user_id": "user_123",
    "verification_required": true
  }
}
```

#### Get User Profile
```http
GET /users/{user_id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "creator",
    "profile": {
      "first_name": "John",
      "last_name": "Doe",
      "bio": "Content creator passionate about technology",
      "avatar_url": "https://cdn.fanz.com/avatars/user_123.jpg",
      "cover_url": "https://cdn.fanz.com/covers/user_123.jpg",
      "follower_count": 1250,
      "following_count": 180,
      "verified": true
    },
    "stats": {
      "total_content": 45,
      "total_views": 125000,
      "total_likes": 8500,
      "monthly_earnings": 2500.00
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-12-01T14:20:00Z"
  }
}
```

#### Update User Profile
```http
PUT /users/{user_id}
```

**Request:**
```json
{
  "profile": {
    "first_name": "John",
    "last_name": "Doe",
    "bio": "Updated bio content",
    "website": "https://johndoe.com",
    "social_links": {
      "twitter": "https://twitter.com/johndoe",
      "instagram": "https://instagram.com/johndoe"
    }
  }
}
```

### 🎨 Content Management

#### Create Content
```http
POST /content
```

**Request:**
```json
{
  "title": "My Amazing Video",
  "description": "This is an amazing video about technology",
  "type": "video", // "video", "image", "audio", "text"
  "category": "technology",
  "tags": ["tech", "programming", "tutorial"],
  "visibility": "public", // "public", "private", "subscribers", "premium"
  "pricing": {
    "type": "free", // "free", "paid", "subscription"
    "amount": 0,
    "currency": "USD"
  },
  "media_urls": [
    "https://uploads.fanz.com/content/video_123.mp4"
  ],
  "thumbnail_url": "https://uploads.fanz.com/thumbs/video_123.jpg",
  "duration": 300, // seconds
  "scheduled_at": null // or ISO date string for scheduled posts
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "content_456",
    "title": "My Amazing Video",
    "slug": "my-amazing-video",
    "status": "published",
    "visibility": "public",
    "creator": {
      "id": "user_123",
      "username": "johndoe",
      "verified": true
    },
    "stats": {
      "views": 0,
      "likes": 0,
      "comments": 0,
      "shares": 0
    },
    "urls": {
      "view": "https://fanz.com/content/content_456",
      "embed": "https://fanz.com/embed/content_456"
    },
    "created_at": "2024-12-01T15:30:00Z"
  }
}
```

#### Get Content List
```http
GET /content?page=1&limit=20&category=technology&type=video&sort=created_at&order=desc
```

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 20, max: 100)
- `category` (string): Filter by category
- `type` (string): Filter by content type
- `creator_id` (string): Filter by creator
- `sort` (string): Sort field (created_at, views, likes, title)
- `order` (string): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "content_456",
        "title": "My Amazing Video",
        "description": "This is an amazing video...",
        "type": "video",
        "category": "technology",
        "thumbnail_url": "https://cdn.fanz.com/thumbs/video_123.jpg",
        "duration": 300,
        "creator": {
          "id": "user_123",
          "username": "johndoe",
          "avatar_url": "https://cdn.fanz.com/avatars/user_123.jpg",
          "verified": true
        },
        "stats": {
          "views": 1500,
          "likes": 125,
          "comments": 23,
          "shares": 8
        },
        "created_at": "2024-12-01T15:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 150,
      "total_pages": 8,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

#### Get Content Details
```http
GET /content/{content_id}
```

#### Update Content
```http
PUT /content/{content_id}
```

#### Delete Content
```http
DELETE /content/{content_id}
```

### 💰 Monetization & Payments

#### Get Creator Earnings
```http
GET /creators/{creator_id}/earnings?period=month&start_date=2024-11-01&end_date=2024-11-30
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-11-01T00:00:00Z",
      "end": "2024-11-30T23:59:59Z",
      "type": "month"
    },
    "total_earnings": 2847.50,
    "breakdown": {
      "subscriptions": 1890.00,
      "tips": 567.50,
      "ppv_content": 245.00,
      "merchandise": 125.00,
      "affiliates": 20.00
    },
    "transactions": {
      "count": 156,
      "successful": 154,
      "failed": 2,
      "pending": 0
    },
    "growth": {
      "amount_change": 347.25,
      "percentage_change": 13.9,
      "trend": "increasing"
    }
  }
}
```

#### Create Payment Intent
```http
POST /payments/intents
```

**Request:**
```json
{
  "type": "tip", // "subscription", "tip", "ppv_content", "merchandise"
  "amount": 25.00,
  "currency": "USD",
  "creator_id": "user_123",
  "content_id": "content_456", // optional, for PPV content
  "message": "Great content! Keep it up!", // optional, for tips
  "payment_method": "card", // "card", "crypto", "bank", "ccbill"
  "metadata": {
    "campaign": "holiday_special"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment_intent_id": "pi_1234567890",
    "amount": 25.00,
    "currency": "USD",
    "status": "requires_payment_method",
    "client_secret": "{{PAYMENT_CLIENT_SECRET}}",
    "processing_fee": 1.25,
    "net_amount": 23.75,
    "creator_receives": 21.38, // after platform fee
    "expires_at": "2024-12-01T16:30:00Z"
  }
}
```

#### Process Payment
```http
POST /payments/intents/{payment_intent_id}/confirm
```

**Request:**
```json
{
  "payment_method_id": "pm_1234567890",
  "return_url": "https://myapp.com/payment-complete"
}
```

### 📊 Analytics & Insights

#### Get Creator Analytics
```http
GET /creators/{creator_id}/analytics?period=month&metrics=views,engagement,revenue
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-11-01T00:00:00Z",
      "end": "2024-11-30T23:59:59Z"
    },
    "overview": {
      "total_views": 45230,
      "total_likes": 3421,
      "total_comments": 892,
      "total_shares": 234,
      "engagement_rate": 10.2,
      "avg_watch_time": 185.5,
      "revenue": 2847.50
    },
    "daily_stats": [
      {
        "date": "2024-11-01",
        "views": 1850,
        "likes": 142,
        "comments": 34,
        "shares": 12,
        "revenue": 95.50
      }
      // ... more daily stats
    ],
    "top_content": [
      {
        "id": "content_789",
        "title": "Best Tutorial Ever",
        "views": 8950,
        "engagement_rate": 15.8,
        "revenue": 245.00
      }
    ],
    "audience_insights": {
      "demographics": {
        "age_groups": {
          "18-24": 28,
          "25-34": 35,
          "35-44": 22,
          "45-54": 12,
          "55+": 3
        },
        "locations": {
          "United States": 45,
          "Canada": 12,
          "United Kingdom": 10,
          "Australia": 8,
          "Germany": 6,
          "Other": 19
        }
      },
      "behavior": {
        "avg_session_duration": 425.8,
        "bounce_rate": 23.5,
        "return_visitor_rate": 67.2
      }
    }
  }
}
```

#### Get Content Analytics
```http
GET /content/{content_id}/analytics
```

### 👥 Social Features

#### Follow/Unfollow User
```http
POST /users/{user_id}/follow
DELETE /users/{user_id}/follow
```

#### Get User Followers
```http
GET /users/{user_id}/followers?page=1&limit=50
```

#### Get User Following
```http
GET /users/{user_id}/following?page=1&limit=50
```

#### Like/Unlike Content
```http
POST /content/{content_id}/like
DELETE /content/{content_id}/like
```

#### Comment on Content
```http
POST /content/{content_id}/comments
```

**Request:**
```json
{
  "text": "Great content! Thanks for sharing.",
  "parent_id": null // for replies to other comments
}
```

#### Get Content Comments
```http
GET /content/{content_id}/comments?page=1&limit=20&sort=created_at&order=desc
```

### 🔔 Notifications

#### Get Notifications
```http
GET /notifications?page=1&limit=50&type=all&read=false
```

**Query Parameters:**
- `type`: all, likes, comments, follows, payments, system
- `read`: true, false, or omit for all

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_123",
        "type": "like",
        "title": "New like on your content",
        "message": "johndoe liked your video 'Amazing Tutorial'",
        "data": {
          "user_id": "user_456",
          "content_id": "content_789",
          "action": "like"
        },
        "read": false,
        "created_at": "2024-12-01T14:30:00Z"
      }
    ],
    "unread_count": 5,
    "pagination": {
      "current_page": 1,
      "per_page": 50,
      "total": 127,
      "has_next": true
    }
  }
}
```

#### Mark Notifications as Read
```http
PUT /notifications/read
```

**Request:**
```json
{
  "notification_ids": ["notif_123", "notif_456"]
}
```

### 🎯 AI & Recommendations

#### Get Content Recommendations
```http
GET /recommendations/content?user_id=user_123&limit=20&type=discover
```

**Query Parameters:**
- `type`: discover, trending, similar, personalized
- `category`: filter by content category
- `exclude_seen`: true/false (default: true)

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "content": {
          "id": "content_999",
          "title": "Advanced JavaScript Tips",
          "creator": {
            "id": "user_888",
            "username": "techguru",
            "verified": true
          },
          "thumbnail_url": "https://cdn.fanz.com/thumbs/content_999.jpg",
          "stats": {
            "views": 25000,
            "likes": 1890
          }
        },
        "score": 0.95,
        "reasons": [
          "Similar to your liked content",
          "Popular in Technology category",
          "Recommended by similar users"
        ]
      }
    ],
    "algorithm": "collaborative_filtering_v2",
    "generated_at": "2024-12-01T15:45:00Z"
  }
}
```

#### Get Creator Recommendations
```http
GET /recommendations/creators?user_id=user_123&limit=10
```

### 🔍 Search

#### Search Content and Creators
```http
GET /search?q=javascript tutorial&type=all&limit=20&page=1
```

**Query Parameters:**
- `q`: search query
- `type`: all, content, creators, users
- `category`: filter by content category
- `sort`: relevance, created_at, views, popularity
- `filters`: additional filters as JSON

**Response:**
```json
{
  "success": true,
  "data": {
    "results": {
      "content": [
        {
          "id": "content_555",
          "title": "JavaScript Tutorial for Beginners",
          "creator": {
            "id": "user_777",
            "username": "jsmaster",
            "verified": true
          },
          "match_score": 0.89,
          "highlights": {
            "title": ["<mark>JavaScript</mark> <mark>Tutorial</mark> for Beginners"]
          }
        }
      ],
      "creators": [
        {
          "id": "user_666",
          "username": "javascriptpro",
          "profile": {
            "first_name": "Sarah",
            "last_name": "Johnson",
            "bio": "Professional JavaScript developer..."
          },
          "match_score": 0.76,
          "stats": {
            "follower_count": 15000,
            "content_count": 89
          }
        }
      ]
    },
    "pagination": {
      "current_page": 1,
      "total": 45,
      "has_next": true
    },
    "suggestions": [
      "javascript frameworks",
      "javascript es6",
      "react tutorial"
    ]
  }
}
```

### 📤 Media Upload

#### Upload Media File
```http
POST /media/upload
```

**Request (multipart/form-data):**
```
file: [binary file data]
type: video|image|audio|document
category: content|avatar|cover|thumbnail
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "media_123",
    "filename": "video.mp4",
    "original_filename": "my-video.mp4",
    "mime_type": "video/mp4",
    "size": 15728640, // bytes
    "duration": 300, // seconds (for video/audio)
    "dimensions": {
      "width": 1920,
      "height": 1080
    },
    "urls": {
      "original": "https://cdn.fanz.com/media/original/media_123.mp4",
      "thumbnail": "https://cdn.fanz.com/media/thumbs/media_123.jpg",
      "preview": "https://cdn.fanz.com/media/preview/media_123.mp4"
    },
    "processing_status": "queued", // queued, processing, completed, failed
    "created_at": "2024-12-01T16:00:00Z"
  }
}
```

#### Get Media Status
```http
GET /media/{media_id}/status
```

### 🛡️ Security & Privacy

#### Get Privacy Settings
```http
GET /users/{user_id}/privacy
```

#### Update Privacy Settings
```http
PUT /users/{user_id}/privacy
```

**Request:**
```json
{
  "profile_visibility": "public", // public, private, followers
  "show_online_status": true,
  "allow_messages": "followers", // everyone, followers, none
  "content_indexing": true,
  "data_sharing": {
    "analytics": true,
    "marketing": false,
    "research": false
  }
}
```

## 🔧 Rate Limits

API rate limits are enforced per endpoint:

- **Authentication**: 100 requests/hour
- **Content Retrieval**: 1000 requests/hour  
- **Content Creation**: 100 requests/hour
- **Media Upload**: 50 uploads/hour
- **Payments**: 500 requests/hour
- **Search**: 500 requests/hour

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 985
X-RateLimit-Reset: 1701456000
```

## 📡 Webhooks

Configure webhooks to receive real-time notifications:

### Setup Webhook Endpoint
```http
POST /webhooks
```

**Request:**
```json
{
  "url": "https://yourapp.com/webhooks/fanz",
  "events": [
    "user.created",
    "content.published",
    "payment.completed",
    "subscription.created"
  ],
  "secret": "your_webhook_secret"
}
```

### Webhook Events

#### User Events
- `user.created` - New user registered
- `user.verified` - User email verified
- `user.updated` - User profile updated
- `user.deleted` - User account deleted

#### Content Events
- `content.published` - New content published
- `content.updated` - Content modified
- `content.deleted` - Content removed
- `content.liked` - Content received like
- `content.commented` - New comment on content

#### Payment Events
- `payment.completed` - Payment processed successfully
- `payment.failed` - Payment processing failed
- `payment.refunded` - Payment refunded
- `payout.processed` - Creator payout processed

#### Subscription Events
- `subscription.created` - New subscription
- `subscription.updated` - Subscription modified
- `subscription.canceled` - Subscription canceled
- `subscription.renewed` - Subscription renewed

### Webhook Payload Example

```json
{
  "id": "evt_1234567890",
  "type": "payment.completed",
  "created": 1701456000,
  "data": {
    "object": {
      "id": "pay_9876543210",
      "amount": 2500, // cents
      "currency": "USD",
      "status": "completed",
      "creator_id": "user_123",
      "fan_id": "user_456",
      "type": "tip",
      "metadata": {
        "content_id": "content_789"
      }
    }
  }
}
```

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // response data
  },
  "meta": {
    "timestamp": "2024-12-01T16:30:00Z",
    "request_id": "req_1234567890"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request data is invalid",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-12-01T16:30:00Z",
    "request_id": "req_1234567890"
  }
}
```

### HTTP Status Codes

- `200` - OK: Request successful
- `201` - Created: Resource created successfully
- `400` - Bad Request: Invalid request data
- `401` - Unauthorized: Authentication required
- `403` - Forbidden: Access denied
- `404` - Not Found: Resource not found
- `422` - Unprocessable Entity: Validation failed
- `429` - Too Many Requests: Rate limit exceeded
- `500` - Internal Server Error: Server error

## 🔐 Security Best Practices

### API Key Security
- Never expose API keys in client-side code
- Use environment variables to store keys
- Rotate keys regularly
- Use different keys for different environments

### Request Security
- Always use HTTPS
- Validate and sanitize all inputs
- Implement proper error handling
- Use idempotency keys for critical operations

### Webhook Security
- Verify webhook signatures
- Use HTTPS endpoints only
- Implement proper retry logic
- Log webhook events for debugging

## 📱 SDK & Libraries

### JavaScript/TypeScript
```bash
npm install @fanz/sdk
```

```javascript
import { FanzClient } from '@fanz/sdk';

const client = new FanzClient({
  apiKey: 'your_api_key',
  environment: 'production' // or 'staging', 'sandbox'
});

// Get user profile
const user = await client.users.get('user_123');

// Create content
const content = await client.content.create({
  title: 'My Video',
  type: 'video',
  media_urls: ['https://...']
});
```

### Python
```bash
pip install fanz-python
```

```python
from fanz import FanzClient

client = FanzClient(
    api_key='your_api_key',
    environment='production'
)

# Get creator earnings
earnings = client.creators.get_earnings('creator_123')
```

### PHP
```bash
composer require fanz/php-sdk
```

```php
<?php
use Fanz\FanzClient;

$client = new FanzClient([
    'api_key' => 'your_api_key',
    'environment' => 'production'
]);

// Search content
$results = $client->search()->content('javascript tutorial');
```

## 🧪 Testing

### Sandbox Environment

Use the sandbox environment for testing:
- Base URL: `https://api-sandbox.fanz.com/v1`
- Test payment methods available
- No real money transactions
- Data reset daily

### Test Data

Sample test data is available in sandbox:
- Test users with various roles
- Sample content across categories
- Mock payment scenarios
- Webhook testing endpoints

## 📞 Support

### Developer Support
- **Email**: developers@fanz.com
- **Discord**: [Join our developer community](https://discord.gg/fanz-dev)
- **Documentation**: https://docs.fanz.com/api
- **Status Page**: https://status.fanz.com

### API Versioning

- Current Version: `v1`
- Backward compatibility maintained
- Breaking changes announced 90 days in advance
- Version specified in URL path: `/v1/...`

---

*Last updated: December 2024*
*For questions or feedback, please contact our developer support team.*