import { useState } from "react";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { PostCard } from "@/components/post-card";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { User, PostWithAuthor, CommentWithAuthor } from "@shared/schema";
import { Edit, MapPin, Calendar, Link as LinkIcon, ArrowLeft } from "lucide-react";
import { Link, useParams } from "wouter";

type TabType = 'posts' | 'replies' | 'media' | 'likes';

export default function UserProfile() {
  const { username } = useParams();
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  
  // Fetch the profile user by username
  const { data: profileUser, isLoading: profileLoading } = useQuery<User>({
    queryKey: ["/api/users", username],
    enabled: !!username,
  });

  // Fetch the profile user's posts by username
  const { data: userPosts = [], isLoading: postsLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/users", username, "posts"],
    enabled: !!username,
  });

  const { data: userReplies = [] } = useQuery<CommentWithAuthor[]>({
    queryKey: ["/api/user/replies"],
  });

  const { data: likedPosts = [] } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/user/likes"],
  });

  // Get current user for comparison
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const isOwnProfile = currentUser?.username === username;
  
  // Filter media posts
  const mediaPosts = userPosts.filter(post => post.imageUrl);

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'posts':
        return "No posts yet";
      case 'replies':
        return "No replies yet";
      case 'media':
        return "No media posts yet";
      case 'likes':
        return "No liked posts yet";
      default:
        return "No content yet";
    }
  };

  const getEmptyDescription = () => {
    switch (activeTab) {
      case 'posts':
        return isOwnProfile ? "Start sharing your thoughts with the universe!" : `@${username} hasn't posted anything yet.`;
      case 'replies':
        return isOwnProfile ? "Join conversations by replying to posts!" : `@${username} hasn't replied to any posts yet.`;
      case 'media':
        return isOwnProfile ? "Share photos and videos with your posts!" : `@${username} hasn't shared any media yet.`;
      case 'likes':
        return isOwnProfile ? "Like posts to see them here!" : `@${username} hasn't liked any posts yet.`;
      default:
        return "No content available.";
    }
  };

  const hasContent = () => {
    switch (activeTab) {
      case 'posts':
        return userPosts.length > 0;
      case 'replies':
        return userReplies.length > 0;
      case 'media':
        return mediaPosts.length > 0;
      case 'likes':
        return likedPosts.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white cyber-grid">
      <Header />
      
      <div className="flex flex-col lg:flex-row pt-14 sm:pt-16 pb-16 lg:pb-0">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        <main className="flex-1 lg:ml-64 max-w-full lg:max-w-4xl mx-auto p-3 sm:p-4 lg:p-6">
          {/* Back Button */}
          <div className="mb-4">
            <Link href="/">
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-cyber-blue transition-colors"
                data-testid="back-button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Feed
              </Button>
            </Link>
          </div>

          {/* Profile Header */}
          <div className="post-card p-6 rounded-xl mb-6">
            <div className="relative">
              {/* Cover Image */}
              <div className="h-32 sm:h-48 bg-gradient-to-r from-cyber-blue/20 to-electric-purple/20 rounded-xl mb-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-blue/10 to-electric-purple/10 animate-pulse"></div>
              </div>
              
              {/* Profile Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-4 -mt-16 sm:-mt-12">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-cyber-blue bg-black overflow-hidden shadow-neon-cyan">
                  <img
                    src={profileUser?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=face"}
                    alt={profileUser?.displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-neon-pink mb-1">
                        {profileUser?.displayName || username}
                      </h1>
                      <p className="text-gray-400">@{username}</p>
                    </div>
                    {isOwnProfile ? (
                      <Link href="/settings">
                        <Button
                          className="neon-button bg-transparent border border-cyber-blue text-cyber-blue hover:bg-cyber-blue hover:text-black transition-all duration-300 mt-2 sm:mt-0"
                          data-testid="edit-profile"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        className="neon-button bg-gradient-to-r from-cyber-blue to-electric-purple text-black font-bold px-6 py-2 rounded-full border-cyber-blue hover:shadow-neon-cyan transition-all duration-300 mt-2 sm:mt-0"
                        data-testid="follow-user"
                      >
                        Follow
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-white mb-4 leading-relaxed">
                    {profileUser?.bio || "Building the future, one line of code at a time"}
                  </p>
                  
                  <div className="flex flex-wrap items-center space-x-4 text-sm text-gray-400 mb-4">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>Cyber City</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined January 2024</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <LinkIcon className="w-4 h-4" />
                      <span className="text-cyber-blue">{username}.dev</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-6 text-sm">
                    <div>
                      <span className="font-bold text-white">{profileUser?.followingCount || 342}</span>
                      <span className="text-gray-400 ml-1">Following</span>
                    </div>
                    <div>
                      <span className="font-bold text-white">{profileUser?.followersCount || 1250}</span>
                      <span className="text-gray-400 ml-1">Followers</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Profile Tabs */}
          <div className="post-card p-1 rounded-xl mb-6">
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                onClick={() => setActiveTab('posts')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                  activeTab === 'posts' 
                    ? 'text-cyber-blue bg-cyber-blue/10' 
                    : 'text-gray-400 hover:text-cyber-blue hover:bg-cyber-blue/10'
                }`}
                data-testid="posts-tab"
              >
                Posts
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab('replies')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                  activeTab === 'replies' 
                    ? 'text-electric-purple bg-electric-purple/10' 
                    : 'text-gray-400 hover:text-electric-purple hover:bg-electric-purple/10'
                }`}
                data-testid="replies-tab"
              >
                Replies
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab('media')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                  activeTab === 'media' 
                    ? 'text-neon-pink bg-neon-pink/10' 
                    : 'text-gray-400 hover:text-neon-pink hover:bg-neon-pink/10'
                }`}
                data-testid="media-tab"
              >
                Media
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab('likes')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                  activeTab === 'likes' 
                    ? 'text-laser-green bg-laser-green/10' 
                    : 'text-gray-400 hover:text-laser-green hover:bg-laser-green/10'
                }`}
                data-testid="likes-tab"
              >
                Likes
              </Button>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="space-y-4 sm:space-y-6 mb-20 lg:mb-0">
            {!hasContent() ? (
              <div className="post-card p-8 rounded-xl text-center">
                <h3 className="text-xl font-semibold text-cyber-blue mb-2">
                  {getEmptyMessage()}
                </h3>
                <p className="text-gray-400">
                  {getEmptyDescription()}
                </p>
              </div>
            ) : (
              <>
                {activeTab === 'posts' && userPosts.map((post) => <PostCard key={post.id} post={post} />)}
                {activeTab === 'media' && mediaPosts.map((post) => <PostCard key={post.id} post={post} />)}
                {activeTab === 'likes' && likedPosts.map((post) => <PostCard key={post.id} post={post} />)}
                {activeTab === 'replies' && userReplies.map((comment) => (
                  <div key={comment.id} className="post-card p-4 sm:p-6 rounded-xl shadow-glow">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-electric-purple overflow-hidden flex-shrink-0">
                        <img
                          src={comment.author.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face"}
                          alt={comment.author.displayName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-electric-purple text-sm sm:text-base">
                            {comment.author.displayName}
                          </h3>
                          <span className="text-gray-400 text-sm">@{comment.author.username}</span>
                          <span className="text-gray-500 text-xs sm:text-sm">replied</span>
                        </div>
                        <p className="text-white text-sm sm:text-base">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}