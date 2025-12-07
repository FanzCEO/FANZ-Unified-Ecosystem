import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Plus,
  TrendingUp,
  Clock,
  Users,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Search,
  Filter,
  Pin,
  Lock,
  Star,
  Crown,
  Flame,
  Award,
  Share2,
  Flag,
  MoreVertical,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { Link } from "wouter";

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  topicsCount: number;
  postsCount: number;
  lastActivity: string;
  moderators: string[];
  isRestricted?: boolean;
}

interface ForumTopic {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  categoryName: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: "fanz" | "creator" | "moderator" | "admin";
  createdAt: string;
  lastActivity: string;
  viewCount: number;
  replyCount: number;
  votes: number;
  userVote?: "up" | "down";
  isPinned?: boolean;
  isLocked?: boolean;
  tags: string[];
  isHot?: boolean;
}

interface ForumPost {
  id: string;
  topicId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: "fanz" | "creator" | "moderator" | "admin";
  createdAt: string;
  votes: number;
  userVote?: "up" | "down";
  replyToId?: string;
  isEdited?: boolean;
  editedAt?: string;
}

export default function ForumPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("activity");
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicContent, setNewTopicContent] = useState("");
  const [newTopicCategory, setNewTopicCategory] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["/api/forum/categories"],
    retry: false,
  });

  const { data: topics } = useQuery({
    queryKey: ["/api/forum/topics", selectedCategory, sortBy],
    retry: false,
  });

  const { data: topicPosts } = useQuery({
    queryKey: ["/api/forum/topics", selectedTopic?.id, "posts"],
    enabled: !!selectedTopic,
    retry: false,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["/api/messages/unread/count"],
    retry: false,
  });

  // Mock data
  const mockCategories: ForumCategory[] = categories || [
    {
      id: "general",
      name: "General Discussion",
      description: "General topics and conversations about the platform",
      topicsCount: 234,
      postsCount: 1567,
      lastActivity: "2024-01-20T15:30:00Z",
      moderators: ["mod1", "mod2"]
    },
    {
      id: "creator-talk",
      name: "Creator Talk",
      description: "Discussions by and for content creators",
      topicsCount: 156,
      postsCount: 892,
      lastActivity: "2024-01-20T14:20:00Z",
      moderators: ["mod1"],
      isRestricted: true
    },
    {
      id: "fan-zone",
      name: "Fan Zone",
      description: "Space for fans to connect and share",
      topicsCount: 189,
      postsCount: 1234,
      lastActivity: "2024-01-20T16:45:00Z",
      moderators: ["mod2", "mod3"]
    },
    {
      id: "support",
      name: "Help & Support",
      description: "Get help with platform features and technical issues",
      topicsCount: 98,
      postsCount: 456,
      lastActivity: "2024-01-20T13:10:00Z",
      moderators: ["admin1", "support1"]
    },
    {
      id: "announcements",
      name: "Announcements",
      description: "Official platform news and updates",
      topicsCount: 23,
      postsCount: 345,
      lastActivity: "2024-01-19T10:00:00Z",
      moderators: ["admin1", "admin2"],
      isRestricted: true
    }
  ];

  const mockTopics: ForumTopic[] = topics || [
    {
      id: "topic1",
      title: "Welcome to the FanzLab Community Forum!",
      content: "This is our official community space where creators and fans can connect, share ideas, and help each other grow. Please read our community guidelines before posting.",
      categoryId: "announcements",
      categoryName: "Announcements",
      authorId: "admin1",
      authorName: "FanzLab Team",
      authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      authorRole: "admin",
      createdAt: "2024-01-15T10:00:00Z",
      lastActivity: "2024-01-20T16:30:00Z",
      viewCount: 2345,
      replyCount: 89,
      votes: 156,
      isPinned: true,
      tags: ["welcome", "community", "guidelines"]
    },
    {
      id: "topic2",
      title: "Tips for New Content Creators - Share Your Experience!",
      content: "Starting as a content creator can be overwhelming. Let's share our best tips and experiences to help newcomers succeed on the platform.",
      categoryId: "creator-talk",
      categoryName: "Creator Talk",
      authorId: "creator1",
      authorName: "Emma Rose",
      authorAvatar: "https://images.unsplash.com/photo-1494790108344-b2ee30e40a34?w=100&h=100&fit=crop&crop=face",
      authorRole: "creator",
      createdAt: "2024-01-18T14:20:00Z",
      lastActivity: "2024-01-20T15:45:00Z",
      viewCount: 1234,
      replyCount: 67,
      votes: 89,
      isHot: true,
      tags: ["tips", "beginners", "advice"]
    },
    {
      id: "topic3",
      title: "How do I increase my subscriber count?",
      content: "I've been creating content for 3 months but my subscriber growth is slow. What strategies have worked for other creators?",
      categoryId: "creator-talk",
      categoryName: "Creator Talk",
      authorId: "newcreator",
      authorName: "Rising Star",
      authorAvatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop&crop=face",
      authorRole: "creator",
      createdAt: "2024-01-19T09:15:00Z",
      lastActivity: "2024-01-20T14:20:00Z",
      viewCount: 567,
      replyCount: 23,
      votes: 34,
      tags: ["growth", "subscribers", "marketing"]
    },
    {
      id: "topic4",
      title: "Feature Request: Dark Mode for Mobile App",
      content: "Would love to see a dark mode option for the mobile app. The current bright theme can be hard on the eyes during late-night browsing.",
      categoryId: "support",
      categoryName: "Help & Support",
      authorId: "user1",
      authorName: "Night Owl",
      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      authorRole: "fanz",
      createdAt: "2024-01-20T22:30:00Z",
      lastActivity: "2024-01-20T23:15:00Z",
      viewCount: 234,
      replyCount: 12,
      votes: 45,
      tags: ["feature-request", "mobile", "ui"]
    }
  ];

  const mockPosts: ForumPost[] = topicPosts || [
    {
      id: "post1",
      topicId: "topic2",
      content: "Great topic! My biggest tip for new creators is consistency. Post regularly and engage with your audience every day. It takes time but it's worth it!",
      authorId: "creator2",
      authorName: "Sophia Luna",
      authorAvatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop&crop=face",
      authorRole: "creator",
      createdAt: "2024-01-18T15:30:00Z",
      votes: 23
    },
    {
      id: "post2",
      topicId: "topic2",
      content: "I agree with @Sophia Luna! Also, don't be afraid to collaborate with other creators. Cross-promotion really helps grow your audience.",
      authorId: "creator3",
      authorName: "Isabella Star",
      authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      authorRole: "creator",
      createdAt: "2024-01-18T16:45:00Z",
      votes: 18,
      replyToId: "post1"
    }
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-600";
      case "moderator": return "bg-green-600";
      case "creator": return "bg-primary";
      case "fanz": return "bg-blue-600";
      default: return "bg-gray-600";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return Crown;
      case "moderator": return Award;
      case "creator": return Star;
      default: return null;
    }
  };

  const createTopic = () => {
    if (!newTopicTitle.trim() || !newTopicContent.trim() || !newTopicCategory) return;
    // Handle topic creation
    setShowCreateTopic(false);
    setNewTopicTitle("");
    setNewTopicContent("");
    setNewTopicCategory("");
  };

  const replyToTopic = () => {
    if (!replyContent.trim()) return;
    // Handle reply creation
    setReplyContent("");
  };

  const voteOnPost = (postId: string, voteType: "up" | "down") => {
    // Handle voting
    console.log("Voting:", postId, voteType);
  };

  const filteredTopics = mockTopics.filter(topic => {
    if (searchQuery && !topic.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedCategory !== "all" && topic.categoryId !== selectedCategory) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case "activity": return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      case "votes": return b.votes - a.votes;
      case "replies": return b.replyCount - a.replyCount;
      case "newest": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default: return 0;
    }
  });

  const hotTopics = mockTopics.filter(topic => topic.isHot || topic.votes > 50);
  const pinnedTopics = mockTopics.filter(topic => topic.isPinned);

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation unreadCount={unreadCount} />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
              <MessageSquare className="w-8 h-8 mr-3 text-primary" />
              FanzForum
            </h1>
            <p className="text-gray-400">Community discussions and support</p>
          </div>
          
          {user && (
            <Button 
              onClick={() => setShowCreateTopic(true)}
              className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Topic
            </Button>
          )}
        </div>

        {selectedTopic ? (
          /* Topic View */
          <div className="space-y-6">
            {/* Topic Header */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedTopic(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        ← Back to Topics
                      </Button>
                      <Badge className="bg-gray-700 text-gray-300">
                        {selectedTopic.categoryName}
                      </Badge>
                      {selectedTopic.isPinned && (
                        <Badge className="bg-yellow-600 text-white">
                          <Pin className="w-3 h-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                      {selectedTopic.isLocked && (
                        <Badge className="bg-red-600 text-white">
                          <Lock className="w-3 h-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                      {selectedTopic.isHot && (
                        <Badge className="bg-orange-600 text-white">
                          <Flame className="w-3 h-3 mr-1" />
                          Hot
                        </Badge>
                      )}
                    </div>
                    
                    <h1 className="text-2xl font-bold text-white mb-3">{selectedTopic.title}</h1>
                    
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={selectedTopic.authorAvatar} alt={selectedTopic.authorName} />
                          <AvatarFallback>{selectedTopic.authorName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">{selectedTopic.authorName}</span>
                            <Badge className={`${getRoleColor(selectedTopic.authorRole)} text-white text-xs`}>
                              {selectedTopic.authorRole.toUpperCase()}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(selectedTopic.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {selectedTopic.viewCount.toLocaleString()} views
                        </span>
                        <span className="flex items-center">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {selectedTopic.replyCount} replies
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mb-4">{selectedTopic.content}</p>
                    
                    <div className="flex items-center space-x-2">
                      {selectedTopic.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => voteOnPost(selectedTopic.id, "up")}
                      className={`text-gray-400 hover:text-green-400 ${
                        selectedTopic.userVote === "up" ? "text-green-400" : ""
                      }`}
                    >
                      <ArrowUp className="w-5 h-5" />
                    </Button>
                    <span className="text-white font-semibold">{selectedTopic.votes}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => voteOnPost(selectedTopic.id, "down")}
                      className={`text-gray-400 hover:text-red-400 ${
                        selectedTopic.userVote === "down" ? "text-red-400" : ""
                      }`}
                    >
                      <ArrowDown className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Posts */}
            <div className="space-y-4">
              {mockPosts.map((post) => {
                const RoleIcon = getRoleIcon(post.authorRole);
                return (
                  <Card key={post.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex space-x-4">
                        <div className="flex flex-col items-center space-y-2">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={post.authorAvatar} alt={post.authorName} />
                            <AvatarFallback>{post.authorName[0]}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex flex-col items-center space-y-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => voteOnPost(post.id, "up")}
                              className={`text-gray-400 hover:text-green-400 p-1 ${
                                post.userVote === "up" ? "text-green-400" : ""
                              }`}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <span className="text-white font-semibold text-sm">{post.votes}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => voteOnPost(post.id, "down")}
                              className={`text-gray-400 hover:text-red-400 p-1 ${
                                post.userVote === "down" ? "text-red-400" : ""
                              }`}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-white font-medium">{post.authorName}</span>
                            <Badge className={`${getRoleColor(post.authorRole)} text-white text-xs`}>
                              {RoleIcon && <RoleIcon className="w-3 h-3 mr-1" />}
                              {post.authorRole.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {new Date(post.createdAt).toLocaleString()}
                            </span>
                            {post.isEdited && (
                              <span className="text-xs text-gray-500">(edited)</span>
                            )}
                          </div>
                          
                          {post.replyToId && (
                            <div className="bg-gray-700 p-2 rounded mb-3 text-sm text-gray-300 border-l-2 border-primary">
                              Replying to previous post...
                            </div>
                          )}
                          
                          <p className="text-gray-300 mb-3">{post.content}</p>
                          
                          <div className="flex items-center space-x-3">
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                              Reply
                            </Button>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                              <Share2 className="w-4 h-4 mr-1" />
                              Share
                            </Button>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400">
                              <Flag className="w-4 h-4 mr-1" />
                              Report
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Reply Form */}
            {user && !selectedTopic.isLocked && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-white font-semibold mb-4">Reply to this topic</h3>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Write your reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setReplyContent("")}>
                        Cancel
                      </Button>
                      <Button onClick={replyToTopic} className="bg-primary">
                        Post Reply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Topics List */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-800 border-gray-700 pl-10 text-white placeholder-gray-400"
                    data-testid="input-topic-search"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
                >
                  <option value="activity">Latest Activity</option>
                  <option value="votes">Most Voted</option>
                  <option value="replies">Most Replies</option>
                  <option value="newest">Newest</option>
                </select>
              </div>

              <Tabs defaultValue="all" className="space-y-6">
                <TabsList className="bg-gray-800 border border-gray-700 p-1">
                  <TabsTrigger value="all" data-testid="tab-all">All Topics</TabsTrigger>
                  <TabsTrigger value="hot" data-testid="tab-hot">
                    <Flame className="w-4 h-4 mr-2" />
                    Hot
                  </TabsTrigger>
                  <TabsTrigger value="pinned" data-testid="tab-pinned">
                    <Pin className="w-4 h-4 mr-2" />
                    Pinned
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  {filteredTopics.map((topic) => {
                    const RoleIcon = getRoleIcon(topic.authorRole);
                    return (
                      <Card
                        key={topic.id}
                        className="bg-gray-800 border-gray-700 cursor-pointer hover:shadow-xl transition-all"
                        onClick={() => setSelectedTopic(topic)}
                      >
                        <CardContent className="p-6">
                          <div className="flex space-x-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={topic.authorAvatar} alt={topic.authorName} />
                              <AvatarFallback>{topic.authorName[0]}</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge className="bg-gray-700 text-gray-300 text-xs">
                                  {topic.categoryName}
                                </Badge>
                                {topic.isPinned && (
                                  <Badge className="bg-yellow-600 text-white text-xs">
                                    <Pin className="w-3 h-3 mr-1" />
                                    Pinned
                                  </Badge>
                                )}
                                {topic.isLocked && (
                                  <Badge className="bg-red-600 text-white text-xs">
                                    <Lock className="w-3 h-3 mr-1" />
                                    Locked
                                  </Badge>
                                )}
                                {topic.isHot && (
                                  <Badge className="bg-orange-600 text-white text-xs">
                                    <Flame className="w-3 h-3 mr-1" />
                                    Hot
                                  </Badge>
                                )}
                              </div>
                              
                              <h3 className="text-white font-semibold text-lg mb-2 hover:text-primary transition-colors">
                                {topic.title}
                              </h3>
                              
                              <p className="text-gray-300 text-sm mb-3 line-clamp-2">{topic.content}</p>
                              
                              <div className="flex items-center space-x-4 text-xs text-gray-400">
                                <div className="flex items-center space-x-2">
                                  <span className="text-white font-medium">{topic.authorName}</span>
                                  <Badge className={`${getRoleColor(topic.authorRole)} text-white text-xs`}>
                                    {RoleIcon && <RoleIcon className="w-3 h-3 mr-1" />}
                                    {topic.authorRole.toUpperCase()}
                                  </Badge>
                                </div>
                                <span>{new Date(topic.createdAt).toLocaleDateString()}</span>
                                <span className="flex items-center">
                                  <Eye className="w-3 h-3 mr-1" />
                                  {topic.viewCount.toLocaleString()}
                                </span>
                                <span className="flex items-center">
                                  <MessageCircle className="w-3 h-3 mr-1" />
                                  {topic.replyCount}
                                </span>
                                <span className="flex items-center">
                                  <ThumbsUp className="w-3 h-3 mr-1" />
                                  {topic.votes}
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap gap-1 mt-3">
                                {topic.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </TabsContent>

                <TabsContent value="hot" className="space-y-4">
                  {hotTopics.map((topic) => (
                    <Card
                      key={topic.id}
                      className="bg-gray-800 border-gray-700 cursor-pointer"
                      onClick={() => setSelectedTopic(topic)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Flame className="w-5 h-5 text-orange-500" />
                          <div className="flex-1">
                            <h4 className="text-white font-semibold">{topic.title}</h4>
                            <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                              <span>{topic.authorName}</span>
                              <span>{topic.votes} votes</span>
                              <span>{topic.replyCount} replies</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="pinned" className="space-y-4">
                  {pinnedTopics.map((topic) => (
                    <Card
                      key={topic.id}
                      className="bg-gray-800 border-gray-700 cursor-pointer"
                      onClick={() => setSelectedTopic(topic)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Pin className="w-5 h-5 text-yellow-500" />
                          <div className="flex-1">
                            <h4 className="text-white font-semibold">{topic.title}</h4>
                            <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                              <span>{topic.authorName}</span>
                              <span>{topic.viewCount.toLocaleString()} views</span>
                              <span>{topic.replyCount} replies</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Categories */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Filter className="w-5 h-5 mr-2 text-primary" />
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`w-full text-left p-2 rounded-lg transition-colors ${
                      selectedCategory === "all" 
                        ? 'bg-primary text-white' 
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    All Categories
                  </button>
                  {mockCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between ${
                        selectedCategory === category.id 
                          ? 'bg-primary text-white' 
                          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                      data-testid={`category-${category.id}`}
                    >
                      <div>
                        <span className="block">{category.name}</span>
                        {category.isRestricted && (
                          <span className="text-xs opacity-75">Restricted</span>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {category.topicsCount}
                      </Badge>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Forum Stats */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                    Forum Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Topics</span>
                    <span className="font-semibold text-white">
                      {mockCategories.reduce((sum, c) => sum + c.topicsCount, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Posts</span>
                    <span className="font-semibold text-white">
                      {mockCategories.reduce((sum, c) => sum + c.postsCount, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Categories</span>
                    <span className="font-semibold text-white">{mockCategories.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Online Users</span>
                    <span className="font-semibold text-green-400">234</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Create Topic Modal */}
        <Dialog open={showCreateTopic} onOpenChange={setShowCreateTopic}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Topic</DialogTitle>
              <DialogDescription className="text-gray-400">
                Start a new discussion in the community
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Category</label>
                <select
                  value={newTopicCategory}
                  onChange={(e) => setNewTopicCategory(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value="">Select a category</option>
                  {mockCategories.filter(c => !c.isRestricted || user?.role === 'creator' || user?.role === 'admin').map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Title</label>
                <Input
                  placeholder="Enter topic title..."
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Content</label>
                <Textarea
                  placeholder="Write your topic content..."
                  value={newTopicContent}
                  onChange={(e) => setNewTopicContent(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white min-h-[150px]"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateTopic(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createTopic}
                  disabled={!newTopicTitle.trim() || !newTopicContent.trim() || !newTopicCategory}
                  className="bg-primary"
                >
                  Create Topic
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}