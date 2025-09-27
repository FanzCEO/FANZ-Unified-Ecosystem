/**
 * 📱 Advanced Feed Screen - FANZ Mobile
 * Enhanced feed with infinite scroll, real-time updates, and AI-powered content
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Dimensions,
  Animated,
  Alert,
  Share,
  StyleSheet
} from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
import { BlurView } from '@react-native-blur/blur';

const { width, height } = Dimensions.get('window');

interface FeedPost {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  creatorVerified: boolean;
  platform: string;
  type: 'photo' | 'video' | 'story' | 'live' | 'nft';
  content: {
    url: string;
    thumbnail?: string;
    duration?: number;
    aspectRatio: number;
  };
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isBookmarked: boolean;
  timestamp: string;
  tags: string[];
  price?: number;
  isSubscriptionRequired: boolean;
  nftInfo?: {
    tokenId: string;
    price: number;
    chain: string;
  };
}

interface FeedState {
  posts: FeedPost[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  selectedPlatform: string;
  viewMode: 'grid' | 'list' | 'story';
}

export const AdvancedFeedScreen: React.FC = () => {
  const [feedState, setFeedState] = useState<FeedState>({
    posts: [],
    loading: false,
    refreshing: false,
    hasMore: true,
    selectedPlatform: 'all',
    viewMode: 'list'
  });

  const [scrollY] = useState(new Animated.Value(0));

  const platforms = [
    { id: 'all', name: 'All', color: '#00d4ff' },
    { id: 'boyFanz', name: 'BoyFanz', color: '#ff6b6b' },
    { id: 'girlFanz', name: 'GirlFanz', color: '#ff69b4' },
    { id: 'daddyFanz', name: 'DaddyFanz', color: '#ffd700' },
    { id: 'pupFanz', name: 'PupFanz', color: '#4ecdc4' },
    { id: 'tabooFanz', name: 'TabooFanz', color: '#e74c3c' },
    { id: 'transFanz', name: 'TransFanz', color: '#9b59b6' },
    { id: 'cougarFanz', name: 'CougarFanz', color: '#f39c12' }
  ];

  useEffect(() => {
    loadFeedPosts();
  }, [feedState.selectedPlatform]);

  const loadFeedPosts = async (refresh = false) => {
    if (feedState.loading && !refresh) return;

    setFeedState(prev => ({ 
      ...prev, 
      loading: true, 
      refreshing: refresh 
    }));

    try {
      // Simulate API call with mock data
      const mockPosts: FeedPost[] = Array.from({ length: 20 }, (_, index) => ({
        id: `post-${Date.now()}-${index}`,
        creatorId: `creator-${index % 8}`,
        creatorName: `Creator${index + 1}`,
        creatorAvatar: `https://picsum.photos/100/100?random=${index}`,
        creatorVerified: Math.random() > 0.3,
        platform: platforms[Math.floor(Math.random() * platforms.length)].id,
        type: ['photo', 'video', 'live', 'nft'][Math.floor(Math.random() * 4)] as any,
        content: {
          url: `https://picsum.photos/400/600?random=${index}`,
          thumbnail: `https://picsum.photos/400/300?random=${index}`,
          duration: Math.random() > 0.5 ? Math.floor(Math.random() * 300) + 30 : undefined,
          aspectRatio: 0.75
        },
        caption: `Amazing content from the creator economy! #creator #fanz #content${index}`,
        likes: Math.floor(Math.random() * 10000),
        comments: Math.floor(Math.random() * 500),
        shares: Math.floor(Math.random() * 100),
        isLiked: Math.random() > 0.7,
        isBookmarked: Math.random() > 0.8,
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
        tags: ['#creator', '#content', '#fanz'],
        price: Math.random() > 0.7 ? Math.floor(Math.random() * 50) + 5 : undefined,
        isSubscriptionRequired: Math.random() > 0.6,
        nftInfo: Math.random() > 0.8 ? {
          tokenId: `nft-${index}`,
          price: Math.floor(Math.random() * 1000) + 100,
          chain: 'polygon'
        } : undefined
      }));

      setFeedState(prev => ({
        ...prev,
        posts: refresh ? mockPosts : [...prev.posts, ...mockPosts],
        loading: false,
        refreshing: false,
        hasMore: mockPosts.length === 20
      }));

    } catch (error) {
      console.error('Failed to load feed posts:', error);
      setFeedState(prev => ({ 
        ...prev, 
        loading: false, 
        refreshing: false 
      }));
      Alert.alert('Error', 'Failed to load feed posts');
    }
  };

  const onRefresh = useCallback(() => {
    loadFeedPosts(true);
  }, [feedState.selectedPlatform]);

  const onEndReached = useCallback(() => {
    if (feedState.hasMore && !feedState.loading) {
      loadFeedPosts(false);
    }
  }, [feedState.hasMore, feedState.loading]);

  const handleLike = async (postId: string) => {
    setFeedState(prev => ({
      ...prev,
      posts: prev.posts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked: !post.isLiked, 
              likes: post.isLiked ? post.likes - 1 : post.likes + 1 
            }
          : post
      )
    }));

    // API call would go here
  };

  const handleBookmark = async (postId: string) => {
    setFeedState(prev => ({
      ...prev,
      posts: prev.posts.map(post => 
        post.id === postId 
          ? { ...post, isBookmarked: !post.isBookmarked }
          : post
      )
    }));
  };

  const handleShare = async (post: FeedPost) => {
    try {
      await Share.share({
        message: `Check out this amazing content from ${post.creatorName} on FANZ!`,
        url: `https://fanz.com/post/${post.id}`
      });
    } catch (error) {
      console.error('Failed to share post:', error);
    }
  };

  const handlePlatformSelect = (platformId: string) => {
    setFeedState(prev => ({ 
      ...prev, 
      selectedPlatform: platformId,
      posts: [] // Clear posts to reload
    }));
  };

  const renderPlatformSelector = () => (
    <View style={styles.platformSelector}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {platforms.map(platform => (
          <TouchableOpacity
            key={platform.id}
            style={[
              styles.platformChip,
              { 
                borderColor: platform.color,
                backgroundColor: feedState.selectedPlatform === platform.id 
                  ? platform.color + '20' 
                  : 'transparent'
              }
            ]}
            onPress={() => handlePlatformSelect(platform.id)}
          >
            <Text style={[
              styles.platformChipText,
              { 
                color: feedState.selectedPlatform === platform.id 
                  ? platform.color 
                  : '#8892b0'
              }
            ]}>
              {platform.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPost = ({ item: post }: { item: FeedPost }) => (
    <View style={styles.postContainer}>
      {/* Creator Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.creatorInfo}>
          <FastImage 
            source={{ uri: post.creatorAvatar }}
            style={styles.creatorAvatar}
          />
          <View style={styles.creatorDetails}>
            <View style={styles.creatorNameRow}>
              <Text style={styles.creatorName}>{post.creatorName}</Text>
              {post.creatorVerified && (
                <Text style={styles.verifiedIcon}>✓</Text>
              )}
            </View>
            <Text style={styles.postTimestamp}>{formatTimestamp(post.timestamp)}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.platformBadge}>
          <Text style={[
            styles.platformBadgeText,
            { color: platforms.find(p => p.id === post.platform)?.color || '#00d4ff' }
          ]}>
            {platforms.find(p => p.id === post.platform)?.name || 'FANZ'}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {post.type === 'video' ? (
          <View style={styles.videoContainer}>
            <FastImage
              source={{ uri: post.content.thumbnail || post.content.url }}
              style={styles.contentImage}
              resizeMode="cover"
            />
            <View style={styles.videoOverlay}>
              <TouchableOpacity style={styles.playButton}>
                <Text style={styles.playIcon}>▶</Text>
              </TouchableOpacity>
              {post.content.duration && (
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>
                    {formatDuration(post.content.duration)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : post.type === 'live' ? (
          <View style={styles.liveContainer}>
            <FastImage
              source={{ uri: post.content.url }}
              style={styles.contentImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.liveOverlay}
            >
              <View style={styles.liveBadge}>
                <Text style={styles.liveText}>🔴 LIVE</Text>
              </View>
            </LinearGradient>
          </View>
        ) : (
          <FastImage
            source={{ uri: post.content.url }}
            style={styles.contentImage}
            resizeMode="cover"
          />
        )}

        {/* Subscription/Price Overlay */}
        {(post.isSubscriptionRequired || post.price) && (
          <BlurView style={styles.priceOverlay} blurType="dark" blurAmount={10}>
            <Text style={styles.priceText}>
              {post.price ? `$${post.price}` : 'Subscription Required'}
            </Text>
          </BlurView>
        )}

        {/* NFT Badge */}
        {post.nftInfo && (
          <View style={styles.nftBadge}>
            <Text style={styles.nftText}>NFT</Text>
          </View>
        )}
      </View>

      {/* Caption */}
      <View style={styles.captionContainer}>
        <Text style={styles.caption}>{post.caption}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <View style={styles.leftActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLike(post.id)}
          >
            <Text style={[styles.actionIcon, { color: post.isLiked ? '#ff69b4' : '#8892b0' }]}>
              {post.isLiked ? '❤️' : '🤍'}
            </Text>
            <Text style={styles.actionCount}>{formatNumber(post.likes)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>{formatNumber(post.comments)}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleShare(post)}
          >
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionCount}>{formatNumber(post.shares)}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.bookmarkButton}
          onPress={() => handleBookmark(post.id)}
        >
          <Text style={[
            styles.actionIcon, 
            { color: post.isBookmarked ? '#ffd700' : '#8892b0' }
          ]}>
            {post.isBookmarked ? '⭐' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslateY }] }]}>
        <Text style={styles.headerTitle}>🎯 Feed</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerButtonText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {renderPlatformSelector()}

      <FlatList
        data={feedState.posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={feedState.refreshing}
            onRefresh={onRefresh}
            tintColor="#00d4ff"
            colors={['#00d4ff']}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        style={styles.feedList}
      />
    </View>
  );
};

// Utility functions
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00d4ff'
  },
  headerActions: {
    flexDirection: 'row'
  },
  headerButton: {
    marginLeft: 16
  },
  headerButtonText: {
    fontSize: 18,
    color: '#ccd6f6'
  },
  platformSelector: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460'
  },
  platformChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
    minWidth: 60,
    alignItems: 'center'
  },
  platformChipText: {
    fontSize: 14,
    fontWeight: '600'
  },
  feedList: {
    flex: 1
  },
  postContainer: {
    backgroundColor: '#16213e',
    marginBottom: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden'
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  creatorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12
  },
  creatorDetails: {
    flex: 1
  },
  creatorNameRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ccd6f6',
    marginRight: 6
  },
  verifiedIcon: {
    fontSize: 12,
    color: '#00d4ff',
    backgroundColor: '#00d4ff20',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8
  },
  postTimestamp: {
    fontSize: 12,
    color: '#8892b0',
    marginTop: 2
  },
  platformBadge: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  platformBadgeText: {
    fontSize: 12,
    fontWeight: '600'
  },
  contentContainer: {
    position: 'relative'
  },
  contentImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#0f3460'
  },
  videoContainer: {
    position: 'relative'
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  playIcon: {
    fontSize: 20,
    color: 'white',
    marginLeft: 4
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  durationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  },
  liveContainer: {
    position: 'relative'
  },
  liveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 12
  },
  liveBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  liveText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  priceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: 'rgba(0,212,255,0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25
  },
  nftBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#9b59b6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  nftText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  captionContainer: {
    padding: 16
  },
  caption: {
    fontSize: 14,
    color: '#ccd6f6',
    lineHeight: 20
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  leftActions: {
    flexDirection: 'row'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 6
  },
  actionCount: {
    fontSize: 14,
    color: '#8892b0'
  },
  bookmarkButton: {
    padding: 4
  }
});

export default AdvancedFeedScreen;