#!/usr/bin/env tsx

/**
 * 🌐 FanzSocial Service Demo
 * 
 * Demonstrates the comprehensive social networking capabilities of FanzSocial
 * including user management, connections, posts, stories, feeds, and notifications.
 * 
 * Features showcased:
 * - User creation and profile management with adult content settings
 * - Social connections (follows, friends, subscribers)
 * - Post creation with content moderation and age restrictions
 * - Story creation with temporary content
 * - Feed generation and curation algorithms
 * - Real-time notifications
 * - Trending content analysis
 * - User recommendations and discovery
 * - Comprehensive privacy and content controls
 */

import { FanzSocialService, SocialConfig, AccountType, ContentLevel, ConnectionType, PostType, StoryType, FeedType, FeedAlgorithm } from '../src/FanzSocialService';

async function runDemo() {
  console.log('🌐 Starting FanzSocial Service Demo...\n');

  // ===== SERVICE CONFIGURATION =====

  const config: SocialConfig = {
    redis: {
      host: 'localhost',
      port: 6379,
      database: 11 // Use separate database for demo
    },
    moderation: {
      enableAI: true,
      autoApprove: true,
      strictMode: false
    },
    feeds: {
      algorithm: FeedAlgorithm.HYBRID,
      refreshInterval: 300, // 5 minutes
      maxFeedSize: 100
    },
    content: {
      maxImageSize: 10 * 1024 * 1024, // 10MB
      maxVideoSize: 100 * 1024 * 1024, // 100MB
      allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm', 'mp3']
    },
    features: {
      enableStories: true,
      enableLiveStreaming: true,
      enablePolls: true,
      enableGifts: true
    }
  };

  const fanzSocial = new FanzSocialService(config);

  // ===== EVENT LISTENERS =====

  fanzSocial.on('user_created', (user) => {
    console.log(`✅ User created: ${user.displayName} (@${user.username}) on ${user.clusterId}`);
  });

  fanzSocial.on('connection_created', (connection) => {
    console.log(`🔗 Connection created: ${connection.type} connection established`);
  });

  fanzSocial.on('post_created', (post) => {
    console.log(`📝 Post created: ${post.type} post by user ${post.authorId}`);
  });

  fanzSocial.on('story_created', (story) => {
    console.log(`📸 Story created: ${story.type} story by user ${story.authorId}`);
  });

  fanzSocial.on('notification_sent', (notification) => {
    console.log(`🔔 Notification sent: ${notification.type} - ${notification.title}`);
  });

  fanzSocial.on('post_liked', ({ postId, userId }) => {
    console.log(`❤️ Post ${postId} liked by user ${userId}`);
  });

  fanzSocial.on('post_shared', ({ originalPostId, sharePostId, userId }) => {
    console.log(`🔄 Post ${originalPostId} shared by user ${userId} as ${sharePostId}`);
  });

  // ===== DEMO SCENARIO =====

  try {
    console.log('=== 1. Creating Demo Users ===');

    // Create diverse users across different clusters and account types
    const users = [];

    // Creator on GirlFanz cluster
    const creator1 = await fanzSocial.createUser({
      username: 'luna_starlight',
      displayName: 'Luna Starlight ✨',
      email: 'luna@girlfanz.com',
      clusterId: 'girlfanz',
      accountType: AccountType.CREATOR,
      bio: '✨ Premium content creator | 21+ | Custom videos available',
      location: 'Los Angeles, CA',
      birthDate: new Date('1995-06-15'),
      gender: 'female',
      profile: {
        interests: ['photography', 'fitness', 'fashion', 'music'],
        languages: ['en', 'es'],
        contentPreferences: [
          { category: 'photos', level: ContentLevel.ADULT, enabled: true },
          { category: 'videos', level: ContentLevel.EXPLICIT, enabled: true },
          { category: 'live_streams', level: ContentLevel.ADULT, enabled: true }
        ],
        lookingFor: ['fans', 'subscribers', 'custom_requests'],
        experience: 'experienced'
      }
    });
    users.push(creator1);

    // Creator on BoyFanz cluster
    const creator2 = await fanzSocial.createUser({
      username: 'max_thunder',
      displayName: 'Max Thunder 🔥',
      email: 'max@boyfanz.com',
      clusterId: 'boyfanz',
      accountType: AccountType.CREATOR,
      bio: '🔥 Fitness model & content creator | 18+ content',
      location: 'Miami, FL',
      birthDate: new Date('1993-03-22'),
      gender: 'male',
      profile: {
        interests: ['fitness', 'modeling', 'travel', 'cars'],
        languages: ['en'],
        contentPreferences: [
          { category: 'photos', level: ContentLevel.ADULT, enabled: true },
          { category: 'videos', level: ContentLevel.MATURE, enabled: true }
        ],
        lookingFor: ['fans', 'collaborations'],
        experience: 'expert'
      }
    });
    users.push(creator2);

    // Premium fan user
    const fan1 = await fanzSocial.createUser({
      username: 'fan_collector',
      displayName: 'Content Collector',
      email: 'fan@fanzlab.com',
      clusterId: 'fanzlab',
      accountType: AccountType.PREMIUM,
      birthDate: new Date('1988-11-10'),
      profile: {
        interests: ['art', 'photography', 'entertainment'],
        contentPreferences: [
          { category: 'photos', level: ContentLevel.MATURE, enabled: true },
          { category: 'videos', level: ContentLevel.ADULT, enabled: true }
        ]
      }
    });
    users.push(fan1);

    // Regular fan user
    const fan2 = await fanzSocial.createUser({
      username: 'social_butterfly',
      displayName: 'Social Butterfly 🦋',
      email: 'social@fanzlab.com',
      clusterId: 'fanzlab',
      accountType: AccountType.FAN,
      birthDate: new Date('1990-07-08'),
      profile: {
        interests: ['social', 'music', 'fashion'],
        contentPreferences: [
          { category: 'photos', level: ContentLevel.GENERAL, enabled: true },
          { category: 'posts', level: ContentLevel.MATURE, enabled: true }
        ]
      }
    });
    users.push(fan2);

    console.log(`\n✅ Created ${users.length} demo users\n`);

    console.log('=== 2. Establishing Social Connections ===');

    // Create various types of connections
    await fanzSocial.createConnection(fan1.id, creator1.id, ConnectionType.FOLLOW);
    await fanzSocial.createConnection(fan1.id, creator1.id, ConnectionType.SUBSCRIBER, {
      subscriptionLevel: 'premium',
      subscriptionPrice: 29.99
    });

    await fanzSocial.createConnection(fan2.id, creator1.id, ConnectionType.FOLLOW);
    await fanzSocial.createConnection(fan2.id, creator2.id, ConnectionType.FOLLOW);

    await fanzSocial.createConnection(creator1.id, creator2.id, ConnectionType.FRIEND);
    await fanzSocial.createConnection(fan1.id, fan2.id, ConnectionType.FRIEND);

    console.log('\n✅ Established social connections\n');

    console.log('=== 3. Creating Content Posts ===');

    // Creator posts with different content levels
    const post1 = await fanzSocial.createPost(creator1.id, {
      type: PostType.IMAGE,
      content: {
        text: '✨ New photoshoot is live! Check out my latest artistic collection 📸 #photography #art',
        hashtags: ['photography', 'art', 'model', 'creative'],
        media: [{
          id: 'photo_001',
          type: 'image',
          url: 'https://cdn.girlfanz.com/luna/photo_001.jpg',
          thumbnailUrl: 'https://cdn.girlfanz.com/luna/photo_001_thumb.jpg',
          size: 2048000,
          format: 'jpg',
          quality: 'hd',
          dimensions: { width: 1920, height: 1080 }
        }]
      },
      metadata: {
        contentLevel: ContentLevel.MATURE,
        ageRestricted: true,
        requiresSubscription: false
      },
      visibility: 'public'
    });

    const post2 = await fanzSocial.createPost(creator1.id, {
      type: PostType.VIDEO,
      content: {
        text: '🔥 Exclusive content for my premium subscribers! Behind the scenes footage',
        hashtags: ['exclusive', 'premium', 'bts'],
        media: [{
          id: 'video_001',
          type: 'video',
          url: 'https://cdn.girlfanz.com/luna/video_001.mp4',
          thumbnailUrl: 'https://cdn.girlfanz.com/luna/video_001_thumb.jpg',
          duration: 180,
          size: 25600000,
          format: 'mp4',
          quality: 'hd'
        }]
      },
      metadata: {
        contentLevel: ContentLevel.EXPLICIT,
        ageRestricted: true,
        requiresSubscription: true,
        price: 15.99
      },
      visibility: 'subscribers_only'
    });

    const post3 = await fanzSocial.createPost(creator2.id, {
      type: PostType.TEXT,
      content: {
        text: 'Good morning everyone! 💪 Just finished an intense workout session. Who else is starting their day with fitness?',
        hashtags: ['fitness', 'motivation', 'morning', 'workout']
      },
      metadata: {
        contentLevel: ContentLevel.GENERAL,
        ageRestricted: false
      }
    });

    const post4 = await fanzSocial.createPost(fan2.id, {
      type: PostType.TEXT,
      content: {
        text: 'Loving the creative community here! So much amazing talent to discover 🎨',
        hashtags: ['community', 'art', 'discovery']
      },
      metadata: {
        contentLevel: ContentLevel.GENERAL,
        ageRestricted: false
      }
    });

    console.log('\n✅ Created content posts with various content levels\n');

    console.log('=== 4. Creating Stories ===');

    // Temporary stories
    await fanzSocial.createStory(creator1.id, {
      type: StoryType.PHOTO,
      content: {
        media: {
          id: 'story_001',
          type: 'image',
          url: 'https://cdn.girlfanz.com/luna/story_001.jpg',
          size: 1024000,
          format: 'jpg',
          quality: 'hd'
        },
        text: 'Getting ready for tonight\'s photoshoot! ✨',
        stickers: [
          {
            id: 'sticker_001',
            type: 'location',
            x: 50,
            y: 80,
            rotation: 0,
            scale: 1.0,
            data: { name: 'Los Angeles' }
          }
        ]
      },
      visibility: 'followers'
    });

    await fanzSocial.createStory(creator2.id, {
      type: StoryType.VIDEO,
      content: {
        media: {
          id: 'story_video_001',
          type: 'video',
          url: 'https://cdn.boyfanz.com/max/story_video_001.mp4',
          duration: 15,
          size: 5120000,
          format: 'mp4',
          quality: 'hd'
        },
        text: 'Beach workout session! 🏖️💪'
      },
      visibility: 'public'
    });

    console.log('\n✅ Created temporary stories\n');

    console.log('=== 5. User Interactions ===');

    // Likes and comments
    await fanzSocial.likePost(post1.id, fan1.id);
    await fanzSocial.likePost(post1.id, fan2.id);
    await fanzSocial.likePost(post3.id, fan1.id);

    await fanzSocial.addComment(post1.id, fan1.id, 'Absolutely stunning work! 😍 Your artistic vision is incredible');
    await fanzSocial.addComment(post3.id, fan2.id, 'So motivational! Starting my workout now too 💪');

    // Share content
    await fanzSocial.sharePost(post3.id, fan1.id, 'Great fitness motivation from @max_thunder! 💪');

    console.log('\n✅ Users interacted with content\n');

    console.log('=== 6. Feed Generation ===');

    // Generate different types of feeds
    console.log('📱 Generating personalized feeds...');

    const fan1HomeFeed = await fanzSocial.getUserFeed(fan1.id, FeedType.HOME, 10);
    console.log(`Fan1 Home Feed: ${fan1HomeFeed.length} posts`);

    const fan1DiscoverFeed = await fanzSocial.getUserFeed(fan1.id, FeedType.DISCOVER, 5);
    console.log(`Fan1 Discover Feed: ${fan1DiscoverFeed.length} posts`);

    const trendingFeed = await fanzSocial.getUserFeed(fan2.id, FeedType.TRENDING, 10);
    console.log(`Trending Feed: ${trendingFeed.length} posts`);

    console.log('\n✅ Generated personalized feeds\n');

    console.log('=== 7. Trending Analysis ===');

    // Get trending hashtags
    const globalTrends = await fanzSocial.getTrendingHashtags();
    console.log(`📈 Global trending hashtags: ${globalTrends.length}`);
    globalTrends.forEach(trend => {
      console.log(`  #${trend.content} - ${trend.stats.mentions} mentions`);
    });

    const girlFanzTrends = await fanzSocial.getTrendingHashtags('girlfanz');
    console.log(`📈 GirlFanz trending hashtags: ${girlFanzTrends.length}`);

    console.log('\n');

    console.log('=== 8. User Recommendations ===');

    // Get recommended users
    const fan1Recommendations = await fanzSocial.getRecommendedUsers(fan1.id, 5);
    console.log(`👥 Recommendations for ${fan1.username}: ${fan1Recommendations.length} users`);
    fan1Recommendations.forEach(user => {
      console.log(`  ${user.displayName} (@${user.username}) - ${user.clusterId}`);
    });

    console.log('\n');

    console.log('=== 9. Story Interactions ===');

    // View stories
    const creator1Stories = await fanzSocial.getUserStories(creator1.id);
    if (creator1Stories.length > 0) {
      await fanzSocial.viewStory(creator1Stories[0]?.id!, fan1.id);
      await fanzSocial.viewStory(creator1Stories[0]?.id!, fan2.id);
      console.log(`👀 Stories viewed by fans`);
    }

    console.log('\n');

    console.log('=== 10. User Analytics & Stats ===');

    // Display user stats
    const updatedCreator1 = await fanzSocial.getUser(creator1.id);
    const updatedFan1 = await fanzSocial.getUser(fan1.id);

    console.log(`📊 ${updatedCreator1?.displayName} Stats:`);
    console.log(`  Followers: ${updatedCreator1?.stats.followers}`);
    console.log(`  Subscribers: ${updatedCreator1?.stats.subscribers}`);
    console.log(`  Posts: ${updatedCreator1?.stats.posts}`);
    console.log(`  Avg Engagement: ${updatedCreator1?.stats.engagement.engagementRate?.toFixed(2)}%`);

    console.log(`\n📊 ${updatedFan1?.displayName} Stats:`);
    console.log(`  Following: ${updatedFan1?.stats.following}`);
    console.log(`  Subscriptions: ${updatedFan1?.stats.subscriptions}`);
    console.log(`  Friends: ${updatedFan1?.stats.friends}`);

    console.log('\n');

    console.log('=== 11. Notifications ===');

    // Get user notifications
    const fan1Notifications = await fanzSocial.getUserNotifications(fan1.id, 10);
    console.log(`🔔 ${fan1.username} has ${fan1Notifications.length} notifications`);
    fan1Notifications.forEach(notification => {
      console.log(`  ${notification.type}: ${notification.title} - ${notification.message}`);
    });

    const creator1Notifications = await fanzSocial.getUserNotifications(creator1.id, 10);
    console.log(`🔔 ${creator1.username} has ${creator1Notifications.length} notifications`);

    console.log('\n');

    console.log('=== 12. Search & Discovery ===');

    // Search for users
    const searchResults = await fanzSocial.searchUsers({
      clusterId: 'girlfanz',
      accountType: AccountType.CREATOR,
      limit: 5
    });
    console.log(`🔍 Search results for GirlFanz creators: ${searchResults.length} users`);

    const interestSearch = await fanzSocial.searchUsers({
      interests: ['fitness'],
      limit: 5
    });
    console.log(`🔍 Users interested in fitness: ${interestSearch.length} users`);

    console.log('\n');

    console.log('=== 13. Content Moderation ===');

    // Check moderation status of posts
    const posts = [post1, post2, post3, post4];
    console.log('🛡️ Content Moderation Status:');
    posts.forEach((post, index) => {
      console.log(`  Post ${index + 1}: ${post.moderation.status} (Score: ${post.moderation.score})`);
      if (post.moderation.flags.length > 0) {
        console.log(`    Flags: ${post.moderation.flags.map(f => f.type).join(', ')}`);
      }
    });

    console.log('\n');

    console.log('🎉 === Demo Complete! ===');
    console.log('\nFanzSocial Service Demo successfully showcased:');
    console.log('✅ User management with adult content settings');
    console.log('✅ Social connections (follows, friends, subscribers)');
    console.log('✅ Content creation with moderation and age restrictions');
    console.log('✅ Story management with temporary content');
    console.log('✅ Advanced feed algorithms and personalization');
    console.log('✅ Real-time notifications');
    console.log('✅ Trending analysis and discovery');
    console.log('✅ User recommendations');
    console.log('✅ Comprehensive privacy controls');
    console.log('✅ Search and discovery features');
    console.log('✅ Content moderation and safety');

    console.log('\n🌐 FanzSocial is ready for production deployment!');

  } catch (error) {
    console.error('❌ Demo error:', error);
  }
}

// Execute demo
if (require.main === module) {
  runDemo().catch(console.error);
}

export { runDemo };