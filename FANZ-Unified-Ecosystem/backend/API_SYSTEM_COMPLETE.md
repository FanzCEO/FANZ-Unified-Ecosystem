# FANZ Cross-Posting API System - Complete Architecture

**Status:** Ready for Implementation
**Date:** November 3, 2025

---

## OVERVIEW

This document outlines the complete REST API system for FANZ cross-posting features. The API provides endpoints for:
- Creator tagging (Facebook-style)
- Multi-platform posting (Instagram/Meta-style)
- Queue management
- Analytics and reporting

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                     FANZ Frontend (React)                        │
│           (BoyFanz, GirlFanz, PupFanz, etc - 48 platforms)      │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FANZ Cross-Posting API                        │
│                     (Express.js + Node.js)                       │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Routes     │→ │   Services   │→ │  Supabase    │         │
│  │  (REST API)  │  │ (Business    │  │   Client     │         │
│  │              │  │  Logic)      │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Middleware   │  │ Validation   │  │  Error       │         │
│  │ (Auth, CORS) │  │ (Joi)        │  │  Handling    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Supabase PostgreSQL Database                     │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │  post_tags           │  │  creator_crosspost_  │            │
│  │  crossposted_posts   │  │  settings            │            │
│  │                      │  │                      │            │
│  │  multiplatform_post_ │  │  creator_multiplatform│           │
│  │  queue               │  │  _settings           │            │
│  │                      │  │                      │            │
│  │  multiplatform_post_ │  │  (RLS Policies)      │            │
│  │  history             │  │                      │            │
│  └──────────────────────┘  └──────────────────────┘            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Queue Worker (Background)                      │
│              Processes multi-platform post queue                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## API ENDPOINTS

### Base URL
```
Production: https://api.fanz.com/v1
Development: http://localhost:3000/api/v1
```

### 1. Creator Tagging Endpoints

#### POST /api/v1/posts/:postId/tags
Create a tag on a post

**Request Body:**
```json
{
  "tagged_creator_id": "uuid",
  "custom_caption": "Optional custom caption"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "post_id": "uuid",
    "tagger_creator_id": "uuid",
    "tagged_creator_id": "uuid",
    "status": "pending",
    "created_at": "2025-11-03T10:00:00Z"
  }
}
```

#### GET /api/v1/tags/pending
Get pending tag requests for authenticated creator

**Query Parameters:**
- `limit` (default: 20, max: 100)
- `offset` (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "post": {
        "id": "uuid",
        "title": "Post title",
        "content_url": "https://..."
      },
      "tagger": {
        "id": "uuid",
        "creator_name": "John Doe"
      },
      "created_at": "2025-11-03T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0
  }
}
```

#### PATCH /api/v1/tags/:tagId/approve
Approve a tag request

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "approved",
    "approved_at": "2025-11-03T10:05:00Z"
  }
}
```

#### PATCH /api/v1/tags/:tagId/reject
Reject a tag request

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "rejected",
    "rejected_at": "2025-11-03T10:05:00Z"
  }
}
```

#### DELETE /api/v1/tags/:tagId
Remove a tag from a post

**Response:**
```json
{
  "success": true,
  "message": "Tag removed successfully"
}
```

### 2. Crosspost Settings Endpoints

#### GET /api/v1/creators/:creatorId/crosspost-settings
Get crosspost settings for a creator

**Response:**
```json
{
  "success": true,
  "data": {
    "creator_id": "uuid",
    "auto_approve_all": false,
    "require_approval": true,
    "notify_on_tag": true,
    "auto_approve_list": [
      {
        "approved_creator_id": "uuid",
        "creator_name": "Jane Smith"
      }
    ]
  }
}
```

#### PUT /api/v1/creators/:creatorId/crosspost-settings
Update crosspost settings

**Request Body:**
```json
{
  "auto_approve_all": false,
  "require_approval": true,
  "notify_on_tag": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "creator_id": "uuid",
    "auto_approve_all": false,
    "require_approval": true,
    "notify_on_tag": true,
    "updated_at": "2025-11-03T10:10:00Z"
  }
}
```

#### POST /api/v1/creators/:creatorId/crosspost-settings/whitelist
Add creator to auto-approve whitelist

**Request Body:**
```json
{
  "approved_creator_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Creator added to auto-approve list"
}
```

### 3. Multi-Platform Posting Endpoints

#### POST /api/v1/posts/:postId/multiplatform
Queue a post for multi-platform posting

**Request Body:**
```json
{
  "target_platforms": ["girlfanz", "pupfanz", "gayfanz"],
  "platform_customizations": {
    "girlfanz": {
      "modified_title": "Custom title for GirlFanz",
      "modified_caption": "Custom caption",
      "modified_hashtags": ["#girlfanz", "#exclusive"],
      "add_platform_watermark": true
    }
  },
  "scheduled_for": "2025-11-03T12:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "queued_items": [
      {
        "id": "uuid",
        "target_platform": "girlfanz",
        "status": "queued",
        "scheduled_for": "2025-11-03T12:00:00Z"
      },
      {
        "id": "uuid",
        "target_platform": "pupfanz",
        "status": "queued",
        "scheduled_for": "2025-11-03T12:00:00Z"
      }
    ],
    "total_queued": 3
  }
}
```

#### GET /api/v1/creators/:creatorId/multiplatform-settings
Get multi-platform settings for a creator

**Response:**
```json
{
  "success": true,
  "data": {
    "creator_id": "uuid",
    "enabled_platforms": ["girlfanz", "pupfanz"],
    "default_platforms": ["girlfanz"],
    "auto_post_enabled": true,
    "platform_preferences": {
      "girlfanz": {
        "add_watermark": true,
        "modify_hashtags": true,
        "custom_prefix": "Exclusive on GirlFanz:"
      }
    }
  }
}
```

#### PUT /api/v1/creators/:creatorId/multiplatform-settings
Update multi-platform settings

**Request Body:**
```json
{
  "enabled_platforms": ["girlfanz", "pupfanz", "gayfanz"],
  "default_platforms": ["girlfanz", "pupfanz"],
  "auto_post_enabled": true,
  "platform_preferences": {
    "girlfanz": {
      "add_watermark": true
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "creator_id": "uuid",
    "enabled_platforms": ["girlfanz", "pupfanz", "gayfanz"],
    "updated_at": "2025-11-03T10:15:00Z"
  }
}
```

### 4. Queue Management Endpoints

#### GET /api/v1/queue
Get queue status for authenticated creator

**Query Parameters:**
- `status` (queued, processing, posted, failed)
- `limit` (default: 20)
- `offset` (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "original_post": {
        "id": "uuid",
        "title": "Post title"
      },
      "target_platform": "girlfanz",
      "status": "queued",
      "retry_count": 0,
      "queued_at": "2025-11-03T10:00:00Z",
      "scheduled_for": "2025-11-03T12:00:00Z"
    }
  ],
  "stats": {
    "queued": 5,
    "processing": 2,
    "posted": 100,
    "failed": 1
  }
}
```

#### DELETE /api/v1/queue/:queueItemId
Cancel a queued post

**Response:**
```json
{
  "success": true,
  "message": "Queue item cancelled"
}
```

#### POST /api/v1/queue/:queueItemId/retry
Manually retry a failed queue item

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "queued",
    "retry_count": 0,
    "scheduled_for": "2025-11-03T10:20:00Z"
  }
}
```

### 5. Analytics Endpoints

#### GET /api/v1/creators/:creatorId/crosspost-analytics
Get crossposting analytics

**Query Parameters:**
- `start_date` (ISO 8601)
- `end_date` (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "total_crossposts": 150,
    "by_platform": {
      "girlfanz": {
        "posts": 50,
        "avg_time_to_post_seconds": 15,
        "total_engagement": {
          "likes": 5000,
          "comments": 200,
          "shares": 50
        }
      },
      "pupfanz": {
        "posts": 50,
        "avg_time_to_post_seconds": 12,
        "total_engagement": {
          "likes": 3000,
          "comments": 150,
          "shares": 30
        }
      }
    },
    "performance_comparison": {
      "original_platform": {
        "avg_likes": 100,
        "avg_comments": 5
      },
      "crossposted_platforms": {
        "avg_likes": 80,
        "avg_comments": 4
      }
    }
  }
}
```

### 6. Health & Status Endpoints

#### GET /api/v1/health
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-03T10:00:00Z",
  "database": "connected",
  "queue_worker": "running",
  "uptime": 3600
}
```

---

## AUTHENTICATION

All endpoints except `/health` require authentication.

**Method:** Bearer Token (Supabase JWT)

**Header:**
```
Authorization: Bearer <supabase_jwt_token>
```

**Token Acquisition:**
Frontend applications get tokens from Supabase Auth after user login.

---

## ERROR RESPONSES

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

**Common Error Codes:**
- `UNAUTHORIZED` (401) - Missing or invalid auth token
- `FORBIDDEN` (403) - User lacks permission
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Invalid request data
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_SERVER_ERROR` (500) - Server error

---

## RATE LIMITING

- **Default:** 100 requests per 15 minutes per IP
- **Authenticated:** 1000 requests per 15 minutes per user
- **Burst:** 10 requests per second

**Rate Limit Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1699000000
```

---

## CORS CONFIGURATION

**Allowed Origins:**
- `https://*.fanz.com`
- `http://localhost:3000` (development)
- `http://localhost:5173` (development - Vite)

**Allowed Methods:** GET, POST, PUT, PATCH, DELETE, OPTIONS

**Allowed Headers:** Authorization, Content-Type

---

## DATA VALIDATION

All request bodies are validated using Joi schemas.

**Example Tag Creation Validation:**
```javascript
{
  tagged_creator_id: Joi.string().uuid().required(),
  custom_caption: Joi.string().max(500).optional()
}
```

---

## DEPLOYMENT

### Environment Variables

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Supabase
SUPABASE_URL=https://mcayxybcgxhfttvwmhgm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# CORS
ALLOWED_ORIGINS=https://boyfanz.com,https://girlfanz.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### Render Deployment

**Service Type:** Web Service

**Build Command:** `cd backend/api && npm install`

**Start Command:** `npm start`

**Health Check Path:** `/api/v1/health`

**Auto-Deploy:** Enabled

**Region:** Oregon (closest to Supabase)

**Plan:** Starter ($7/month) or Standard ($25/month for production)

---

## IMPLEMENTATION FILES

### Directory Structure
```
backend/api/
├── server.js                 # Main Express server
├── package.json             # Dependencies
├── .env                     # Environment variables (not committed)
├── .env.example             # Environment template
├── .gitignore               # Git ignore rules
├── routes/
│   ├── tags.js              # Creator tagging routes
│   ├── crosspost.js         # Crosspost settings routes
│   ├── multiplatform.js     # Multi-platform posting routes
│   ├── queue.js             # Queue management routes
│   └── analytics.js         # Analytics routes
├── services/
│   ├── tagService.js        # Tag business logic
│   ├── crosspostService.js  # Crosspost business logic
│   ├── multiplatformService.js # Multi-platform logic
│   ├── queueService.js      # Queue management logic
│   └── analyticsService.js  # Analytics logic
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── errorHandler.js      # Error handling middleware
│   ├── rateLimiter.js       # Rate limiting middleware
│   └── validator.js         # Request validation middleware
├── config/
│   ├── supabase.js          # Supabase client config
│   └── cors.js              # CORS configuration
└── utils/
    ├── responseFormatter.js # Standardized responses
    └── logger.js            # Logging utilities
```

---

## INTEGRATION WITH FRONTEND

### React Hook Example

```typescript
// hooks/useCrossposting.ts
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export function useCrossposting() {
  const supabase = useSupabaseClient();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const createTag = async (postId: string, taggedCreatorId: string) => {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${apiUrl}/api/v1/posts/${postId}/tags`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tagged_creator_id: taggedCreatorId })
    });

    return response.json();
  };

  const getPendingTags = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${apiUrl}/api/v1/tags/pending`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`
      }
    });

    return response.json();
  };

  return {
    createTag,
    getPendingTags
  };
}
```

---

## TESTING

### Manual Testing with cURL

**Create a tag:**
```bash
curl -X POST https://api.fanz.com/v1/posts/POST_ID/tags \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tagged_creator_id": "CREATOR_UUID"}'
```

**Get pending tags:**
```bash
curl -X GET https://api.fanz.com/v1/tags/pending \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## MONITORING

### Key Metrics to Monitor

1. **Request Volume:** Track requests/second
2. **Response Time:** Monitor p50, p95, p99 latencies
3. **Error Rate:** Track 4xx and 5xx responses
4. **Database Connections:** Monitor connection pool
5. **Queue Processing:** Track queue depth and processing rate

### Recommended Tools

- **Application:** New Relic, Datadog, or Render Metrics
- **Logs:** Papertrail or Logtail
- **Uptime:** Pingdom or UptimeRobot
- **Errors:** Sentry or Rollbar

---

## SECURITY CONSIDERATIONS

### Authentication & Authorization
- All endpoints require valid Supabase JWT
- Row Level Security (RLS) enforced at database level
- Service role key only used server-side

### Input Validation
- All inputs validated with Joi schemas
- SQL injection prevented via parameterized queries
- XSS prevention via output encoding

### Rate Limiting
- IP-based and user-based rate limits
- Progressive backoff on repeated violations
- Permanent ban for severe abuse

### HTTPS Only
- All production traffic over HTTPS
- HSTS headers enabled
- Secure cookies only

---

## NEXT STEPS

1. **Implement server.js** - Main Express application
2. **Create route handlers** - Implement all API endpoints
3. **Write service layer** - Business logic and Supabase integration
4. **Add middleware** - Auth, validation, error handling
5. **Test locally** - Verify all endpoints work
6. **Deploy to Render** - Production deployment
7. **Update render.yaml** - Add API service configuration
8. **Integrate with frontend** - Connect React components
9. **Monitor and optimize** - Track performance, fix issues

---

## COST ESTIMATE

**Render (API Server):**
- Starter: $7/month (512MB RAM, good for 100-1000 users)
- Standard: $25/month (2GB RAM, good for 1000-10000 users)

**Supabase (Database):**
- Free: $0/month (500MB database, good for testing)
- Pro: $25/month (8GB database, good for production)

**Total Monthly Cost:**
- Development: $7/month (Render Starter + Supabase Free)
- Production: $50/month (Render Standard + Supabase Pro)

---

**Status:** Architecture Complete - Ready for Implementation
**Next Action:** Implement server.js and core routes

*Last Updated: 2025-11-03*
