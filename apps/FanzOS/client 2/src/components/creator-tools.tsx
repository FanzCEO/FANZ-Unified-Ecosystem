import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calendar as CalendarIcon,
  Clock,
  Upload,
  Image,
  Video,
  FileText,
  Users,
  DollarSign,
  Lock,
  Unlock,
  Send,
  Save,
  Edit,
  Trash2,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Timer,
  Repeat,
  Target,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Package,
  Gift,
  Sparkles,
  Zap,
  Shield,
  Award,
  Star,
  BookOpen,
  Palette,
  Layers,
  Grid3X3,
  Copy,
  ArrowUpRight,
  Archive,
  RefreshCw,
  Filter,
  Search,
  MoreVertical,
  Hash,
  Link2,
  Crown,
  Gem,
  Ticket,
  ShoppingBag,
  BellRing,
  UserPlus,
  UserCheck,
  CreditCard
} from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isToday, isPast, isFuture } from "date-fns";

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  mediaType?: "image" | "video" | "text";
  mediaUrls?: string[];
  scheduledFor: Date;
  status: "draft" | "scheduled" | "published" | "failed";
  visibility: "free" | "subscription" | "ppv";
  ppvPrice?: number;
  tags?: string[];
  series?: string;
  autoDelete?: boolean;
  autoDeleteAfter?: number;
  engagement?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
}

interface ContentRequest {
  id: string;
  fanzId: string;
  fanzName: string;
  fanzAvatar?: string;
  description: string;
  budget: number;
  deadline: Date;
  status: "pending" | "accepted" | "in_progress" | "delivered" | "completed" | "rejected" | "expired";
  category: string;
  escrowStatus: "pending" | "held" | "released" | "refunded";
  deliverables?: {
    id: string;
    type: string;
    url: string;
    uploadedAt: Date;
  }[];
  messages?: {
    id: string;
    sender: string;
    message: string;
    timestamp: Date;
  }[];
  rating?: number;
  review?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "editor" | "moderator" | "assistant" | "photographer";
  permissions: {
    canPost: boolean;
    canSchedule: boolean;
    canMessage: boolean;
    canViewAnalytics: boolean;
    canManageRequests: boolean;
  };
  avatar?: string;
  joinedAt: Date;
  lastActive: Date;
}

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  category: string;
  content: {
    title: string;
    body: string;
    tags: string[];
    mediaCount: number;
  };
  usageCount: number;
  lastUsed?: Date;
}

interface CreatorToolsProps {
  onPostScheduled?: (post: ScheduledPost) => void;
  onRequestAccepted?: (request: ContentRequest) => void;
}

export default function CreatorTools({ onPostScheduled, onRequestAccepted }: CreatorToolsProps) {
  const { user } = useAuth() as { user: User | undefined };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list" | "grid">("calendar");
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ContentRequest | null>(null);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form state for scheduling
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postMediaType, setPostMediaType] = useState<"image" | "video" | "text">("image");
  const [postVisibility, setPostVisibility] = useState<"free" | "subscription" | "ppv">("subscription");
  const [postPpvPrice, setPostPpvPrice] = useState(9.99);
  const [postTags, setPostTags] = useState<string[]>([]);
  const [postSeries, setPostSeries] = useState("");
  const [postAutoDelete, setPostAutoDelete] = useState(false);
  const [postAutoDeleteDays, setPostAutoDeleteDays] = useState(30);
  const [scheduleTime, setScheduleTime] = useState("12:00");
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  
  // Fetch scheduled posts
  const { data: scheduledPosts = [], isLoading: postsLoading } = useQuery<ScheduledPost[]>({
    queryKey: ["/api/creator/scheduled-posts"],
  });
  
  // Fetch content requests
  const { data: contentRequests = [], isLoading: requestsLoading } = useQuery<ContentRequest[]>({
    queryKey: ["/api/creator/content-requests"],
  });
  
  // Fetch team members
  const { data: teamMembers = [], isLoading: teamLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/creator/team-members"],
  });
  
  // Fetch content templates
  const { data: templates = [] } = useQuery<ContentTemplate[]>({
    queryKey: ["/api/creator/content-templates"],
  });
  
  // Mock data for demonstration
  const mockScheduledPosts: ScheduledPost[] = scheduledPosts.length ? scheduledPosts : [
    {
      id: "1",
      title: "Exclusive Photoshoot BTS",
      content: "Behind the scenes from today's photoshoot! 📸",
      mediaType: "image",
      mediaUrls: ["photo1.jpg", "photo2.jpg"],
      scheduledFor: addDays(new Date(), 1),
      status: "scheduled",
      visibility: "subscription",
      tags: ["photoshoot", "bts", "exclusive"],
      series: "Weekly BTS",
      engagement: { views: 0, likes: 0, comments: 0, shares: 0 }
    },
    {
      id: "2",
      title: "Q&A Session Announcement",
      content: "Live Q&A this Friday at 8 PM EST! Send your questions 💬",
      mediaType: "text",
      scheduledFor: addDays(new Date(), 3),
      status: "scheduled",
      visibility: "free",
      tags: ["q&a", "live", "interactive"],
      engagement: { views: 0, likes: 0, comments: 0, shares: 0 }
    },
    {
      id: "3",
      title: "Premium Video Drop",
      content: "New exclusive video content! 🎥✨",
      mediaType: "video",
      mediaUrls: ["video1.mp4"],
      scheduledFor: addDays(new Date(), 7),
      status: "scheduled",
      visibility: "ppv",
      ppvPrice: 24.99,
      tags: ["video", "premium", "exclusive"],
      engagement: { views: 0, likes: 0, comments: 0, shares: 0 }
    }
  ];
  
  const mockContentRequests: ContentRequest[] = contentRequests.length ? contentRequests : [
    {
      id: "1",
      fanId: "fan1",
      fanName: "VIPFan123",
      fanAvatar: "https://via.placeholder.com/40",
      description: "Custom birthday video message for my friend Sarah. She loves your content! Please mention her name and wish her a happy 25th birthday.",
      budget: 100,
      deadline: addDays(new Date(), 5),
      status: "pending",
      category: "Custom Video",
      escrowStatus: "pending"
    },
    {
      id: "2",
      fanId: "fan2",
      fanName: "SuperSupporter",
      fanAvatar: "https://via.placeholder.com/40",
      description: "Exclusive photoshoot in specific outfit (details in DM). High quality images preferred.",
      budget: 250,
      deadline: addDays(new Date(), 10),
      status: "accepted",
      category: "Photoshoot",
      escrowStatus: "held",
      deliverables: [
        { id: "d1", type: "image", url: "preview1.jpg", uploadedAt: new Date() }
      ]
    },
    {
      id: "3",
      fanId: "fan3",
      fanName: "LoyalFollower",
      fanAvatar: "https://via.placeholder.com/40",
      description: "Personalized audio message with motivational content for my workout routine.",
      budget: 50,
      deadline: addDays(new Date(), 3),
      status: "in_progress",
      category: "Audio Message",
      escrowStatus: "held"
    }
  ];
  
  const mockTeamMembers: TeamMember[] = teamMembers.length ? teamMembers : [
    {
      id: "1",
      name: "Alex Editor",
      email: "alex@team.com",
      role: "editor",
      permissions: {
        canPost: true,
        canSchedule: true,
        canMessage: false,
        canViewAnalytics: true,
        canManageRequests: false
      },
      avatar: "https://via.placeholder.com/40",
      joinedAt: new Date("2024-01-01"),
      lastActive: new Date()
    },
    {
      id: "2",
      name: "Sam Assistant",
      email: "sam@team.com",
      role: "assistant",
      permissions: {
        canPost: false,
        canSchedule: false,
        canMessage: true,
        canViewAnalytics: false,
        canManageRequests: true
      },
      avatar: "https://via.placeholder.com/40",
      joinedAt: new Date("2024-01-15"),
      lastActive: new Date()
    }
  ];
  
  const mockTemplates: ContentTemplate[] = templates.length ? templates : [
    {
      id: "1",
      name: "Weekly Update",
      description: "Standard weekly update post template",
      category: "Updates",
      content: {
        title: "Weekly Update - [Date]",
        body: "Hey loves! Here's what's coming this week...",
        tags: ["update", "weekly", "schedule"],
        mediaCount: 3
      },
      usageCount: 45,
      lastUsed: new Date()
    },
    {
      id: "2",
      name: "PPV Teaser",
      description: "Teaser post for premium content",
      category: "Marketing",
      content: {
        title: "🔥 New Exclusive Content Alert!",
        body: "Just dropped something special for my VIPs...",
        tags: ["ppv", "exclusive", "premium"],
        mediaCount: 1
      },
      usageCount: 28,
      lastUsed: addDays(new Date(), -2)
    }
  ];
  
  // Schedule post mutation
  const schedulePostMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/creator/scheduled-posts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/scheduled-posts"] });
      setShowScheduleDialog(false);
      toast({
        title: "Post scheduled",
        description: "Your content has been scheduled successfully",
      });
      // Reset form
      setPostTitle("");
      setPostContent("");
      setPostTags([]);
    }
  });
  
  // Accept request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiRequest("PUT", `/api/creator/content-requests/${requestId}/accept`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/content-requests"] });
      toast({
        title: "Request accepted",
        description: "The content request has been accepted and funds are in escrow",
      });
      if (onRequestAccepted && selectedRequest) {
        onRequestAccepted(selectedRequest);
      }
    }
  });
  
  // Deliver content mutation
  const deliverContentMutation = useMutation({
    mutationFn: async ({ requestId, files }: { requestId: string; files: any[] }) => {
      const response = await apiRequest("POST", `/api/creator/content-requests/${requestId}/deliver`, { files });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/content-requests"] });
      toast({
        title: "Content delivered",
        description: "Your content has been delivered to the fanz",
      });
    }
  });
  
  // Delete scheduled post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiRequest("DELETE", `/api/creator/scheduled-posts/${postId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/scheduled-posts"] });
      toast({
        title: "Post deleted",
        description: "The scheduled post has been deleted",
      });
    }
  });
  
  // Helper functions
  const getPostsForDate = (date: Date) => {
    return mockScheduledPosts.filter(post => 
      isSameDay(new Date(post.scheduledFor), date)
    );
  };
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case "scheduled": return "bg-blue-900 text-blue-400";
      case "published": return "bg-green-900 text-green-400";
      case "draft": return "bg-gray-700 text-gray-400";
      case "failed": return "bg-red-900 text-red-400";
      case "pending": return "bg-yellow-900 text-yellow-400";
      case "accepted": return "bg-blue-900 text-blue-400";
      case "in_progress": return "bg-purple-900 text-purple-400";
      case "delivered": return "bg-indigo-900 text-indigo-400";
      case "completed": return "bg-green-900 text-green-400";
      case "rejected": return "bg-red-900 text-red-400";
      default: return "bg-gray-700 text-gray-400";
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  const handleSchedulePost = () => {
    const scheduledDateTime = new Date(selectedDate);
    const [hours, minutes] = scheduleTime.split(':');
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    schedulePostMutation.mutate({
      title: postTitle,
      content: postContent,
      mediaType: postMediaType,
      scheduledFor: scheduledDateTime,
      visibility: postVisibility,
      ppvPrice: postVisibility === "ppv" ? postPpvPrice : undefined,
      tags: postTags,
      series: postSeries,
      autoDelete: postAutoDelete,
      autoDeleteAfter: postAutoDelete ? postAutoDeleteDays : undefined,
      recurring: recurringEnabled ? recurringFrequency : undefined
    });
  };
  
  const handleAcceptRequest = (request: ContentRequest) => {
    acceptRequestMutation.mutate(request.id);
  };
  
  const handleDeliverContent = (requestId: string, files: any[]) => {
    deliverContentMutation.mutate({ requestId, files });
  };
  
  const handleUseTemplate = (template: ContentTemplate) => {
    setPostTitle(template.content.title);
    setPostContent(template.content.body);
    setPostTags(template.content.tags);
    setShowScheduleDialog(true);
  };
  
  const filteredRequests = mockContentRequests.filter(request => {
    if (filterStatus !== "all" && request.status !== filterStatus) return false;
    if (searchQuery && !request.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  
  if (postsLoading || requestsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList className="bg-gray-800 border border-gray-700">
          <TabsTrigger value="schedule">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Post Scheduler
          </TabsTrigger>
          <TabsTrigger value="requests">
            <Package className="w-4 h-4 mr-2" />
            Content Requests
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="w-4 h-4 mr-2" />
            Team & Delegation
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Layers className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="automation">
            <Zap className="w-4 h-4 mr-2" />
            Automation
          </TabsTrigger>
        </TabsList>
        
        {/* Post Scheduler Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Content Calendar</CardTitle>
                  <CardDescription className="text-gray-400">
                    Schedule and manage your posts
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                    <SelectTrigger className="w-[120px] bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="calendar">Calendar</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                      <SelectItem value="grid">Grid</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => setShowScheduleDialog(true)}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Post
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === "calendar" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDate(addDays(selectedDate, -7))}
                      className="text-gray-400"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h3 className="text-lg font-semibold text-white">
                      {format(selectedDate, 'MMMM yyyy')}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                      className="text-gray-400"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-xs text-gray-400 font-semibold p-2">
                        {day}
                      </div>
                    ))}
                    
                    {Array.from({ length: 35 }, (_, i) => {
                      const date = addDays(startOfWeek(startOfMonth(selectedDate)), i);
                      const posts = getPostsForDate(date);
                      const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                      
                      return (
                        <div
                          key={i}
                          className={`
                            min-h-[80px] p-2 border border-gray-700 rounded-lg cursor-pointer
                            ${isToday(date) ? 'bg-gray-700' : 'bg-gray-800'}
                            ${!isCurrentMonth ? 'opacity-50' : ''}
                            hover:bg-gray-700 transition-colors
                          `}
                          onClick={() => setSelectedDate(date)}
                        >
                          <div className="text-xs text-gray-400 mb-1">
                            {format(date, 'd')}
                          </div>
                          {posts.slice(0, 2).map(post => (
                            <div
                              key={post.id}
                              className="text-xs bg-gray-700 rounded px-1 py-0.5 mb-1 truncate"
                              title={post.title}
                            >
                              <Badge className={`text-xs ${getStatusColor(post.status)}`}>
                                {post.title}
                              </Badge>
                            </div>
                          ))}
                          {posts.length > 2 && (
                            <div className="text-xs text-gray-400">
                              +{posts.length - 2} more
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Selected date posts */}
                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">
                        Posts for {format(selectedDate, 'MMMM d, yyyy')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {getPostsForDate(selectedDate).length === 0 ? (
                        <p className="text-gray-400 text-center py-4">No posts scheduled for this date</p>
                      ) : (
                        <div className="space-y-2">
                          {getPostsForDate(selectedDate).map(post => (
                            <Card key={post.id} className="bg-gray-800 border-gray-600">
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge className={getStatusColor(post.status)}>
                                        {post.status}
                                      </Badge>
                                      <Badge className="bg-gray-700 text-gray-300">
                                        {post.visibility}
                                      </Badge>
                                      {post.mediaType && (
                                        <Badge className="bg-gray-700 text-gray-300">
                                          {post.mediaType === "image" && <Image className="w-3 h-3 mr-1" />}
                                          {post.mediaType === "video" && <Video className="w-3 h-3 mr-1" />}
                                          {post.mediaType === "text" && <FileText className="w-3 h-3 mr-1" />}
                                          {post.mediaType}
                                        </Badge>
                                      )}
                                    </div>
                                    <h4 className="font-semibold text-white mb-1">{post.title}</h4>
                                    <p className="text-sm text-gray-400 mb-2">{post.content}</p>
                                    {post.ppvPrice && (
                                      <p className="text-sm text-green-400 font-semibold">
                                        PPV: {formatCurrency(post.ppvPrice)}
                                      </p>
                                    )}
                                    {post.tags && post.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {post.tags.map(tag => (
                                          <Badge key={tag} className="bg-gray-700 text-gray-300 text-xs">
                                            <Hash className="w-3 h-3 mr-1" />
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setSelectedPost(post)}
                                      className="text-gray-400 hover:text-white"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => deletePostMutation.mutate(post.id)}
                                      className="text-red-400 hover:text-red-300"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {viewMode === "list" && (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {mockScheduledPosts.map(post => (
                      <Card key={post.id} className="bg-gray-700 border-gray-600">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getStatusColor(post.status)}>
                                  {post.status}
                                </Badge>
                                <span className="text-sm text-gray-400">
                                  {format(new Date(post.scheduledFor), 'MMM d, yyyy h:mm a')}
                                </span>
                              </div>
                              <h4 className="font-semibold text-white">{post.title}</h4>
                              <p className="text-sm text-gray-400">{post.content}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              {post.engagement && (
                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                  <span className="flex items-center">
                                    <Eye className="w-4 h-4 mr-1" />
                                    {post.engagement.views}
                                  </span>
                                  <span className="flex items-center">
                                    <Heart className="w-4 h-4 mr-1" />
                                    {post.engagement.likes}
                                  </span>
                                  <span className="flex items-center">
                                    <MessageCircle className="w-4 h-4 mr-1" />
                                    {post.engagement.comments}
                                  </span>
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-gray-400 hover:text-white"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Content Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Special Content Requests</CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage custom content requests from fanz with escrow protection
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px] bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="all">All Requests</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search requests..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white pl-10 w-[200px]"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Request Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400">Total Requests</p>
                        <p className="text-2xl font-bold text-white">
                          {mockContentRequests.length}
                        </p>
                      </div>
                      <Package className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400">In Escrow</p>
                        <p className="text-2xl font-bold text-white">
                          {formatCurrency(
                            mockContentRequests
                              .filter(r => r.escrowStatus === "held")
                              .reduce((sum, r) => sum + r.budget, 0)
                          )}
                        </p>
                      </div>
                      <Shield className="w-8 h-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400">Pending</p>
                        <p className="text-2xl font-bold text-white">
                          {mockContentRequests.filter(r => r.status === "pending").length}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400">Completion Rate</p>
                        <p className="text-2xl font-bold text-white">92%</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Requests List */}
              <div className="space-y-4">
                {filteredRequests.map(request => (
                  <Card key={request.id} className="bg-gray-700 border-gray-600">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={request.fanAvatar} />
                            <AvatarFallback>{request.fanName.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-white">{request.fanName}</h4>
                              <Badge className={getStatusColor(request.status)}>
                                {request.status.replace('_', ' ')}
                              </Badge>
                              <Badge className="bg-gray-600 text-gray-300">
                                {request.category}
                              </Badge>
                              {request.escrowStatus === "held" && (
                                <Badge className="bg-green-900 text-green-400">
                                  <Lock className="w-3 h-3 mr-1" />
                                  Escrow Protected
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-300 mb-3">{request.description}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-green-400 font-semibold">
                                {formatCurrency(request.budget)}
                              </span>
                              <span className="text-gray-400 flex items-center">
                                <CalendarIcon className="w-3 h-3 mr-1" />
                                Due: {format(new Date(request.deadline), 'MMM d, yyyy')}
                              </span>
                              {isPast(new Date(request.deadline)) && (
                                <Badge className="bg-red-900 text-red-400">Overdue</Badge>
                              )}
                            </div>
                            
                            {request.deliverables && request.deliverables.length > 0 && (
                              <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                                <p className="text-xs text-gray-400 mb-2">Delivered Content</p>
                                <div className="flex gap-2">
                                  {request.deliverables.map(deliverable => (
                                    <div key={deliverable.id} className="flex items-center gap-1 text-xs text-gray-300">
                                      {deliverable.type === "image" && <Image className="w-3 h-3" />}
                                      {deliverable.type === "video" && <Video className="w-3 h-3" />}
                                      <span>{deliverable.type}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          {request.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleAcceptRequest(request)}
                                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-600 text-red-400 hover:bg-red-900"
                              >
                                Decline
                              </Button>
                            </>
                          )}
                          {request.status === "accepted" && (
                            <Button
                              size="sm"
                              onClick={() => setShowRequestDialog(true)}
                              className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload
                            </Button>
                          )}
                          {request.status === "delivered" && (
                            <Badge className="bg-blue-900 text-blue-400">
                              <Clock className="w-3 h-3 mr-1" />
                              Awaiting Review
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedRequest(request)}
                            className="text-gray-400 hover:text-white"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Chat
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Team & Delegation Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Team Management</CardTitle>
                  <CardDescription className="text-gray-400">
                    Delegate tasks and manage team permissions
                  </CardDescription>
                </div>
                <Button className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTeamMembers.map(member => (
                  <Card key={member.id} className="bg-gray-700 border-gray-600">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-white">{member.name}</h4>
                            <p className="text-sm text-gray-400">{member.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className="bg-primary/20 text-primary capitalize">
                                {member.role}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                Last active: {format(new Date(member.lastActive), 'MMM d, h:mm a')}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h5 className="text-xs font-semibold text-gray-400 mb-2">Permissions</h5>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(member.permissions).map(([perm, enabled]) => (
                              <div key={perm} className="flex items-center gap-2">
                                <Switch
                                  checked={enabled}
                                  className="data-[state=checked]:bg-primary h-4 w-8"
                                />
                                <span className="text-xs text-gray-400 capitalize">
                                  {perm.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Content Templates</CardTitle>
                  <CardDescription className="text-gray-400">
                    Reusable templates for faster content creation
                  </CardDescription>
                </div>
                <Button className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockTemplates.map(template => (
                  <Card key={template.id} className="bg-gray-700 border-gray-600">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-white">{template.name}</h4>
                          <p className="text-sm text-gray-400">{template.description}</p>
                        </div>
                        <Badge className="bg-gray-600 text-gray-300">
                          {template.category}
                        </Badge>
                      </div>
                      
                      <div className="p-3 bg-gray-800 rounded-lg mb-3">
                        <p className="text-xs text-gray-400 mb-1">Preview</p>
                        <p className="text-sm text-white font-semibold mb-1">{template.content.title}</p>
                        <p className="text-xs text-gray-300 line-clamp-2">{template.content.body}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.content.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} className="bg-gray-700 text-gray-400 text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center">
                            <Copy className="w-3 h-3 mr-1" />
                            Used {template.usageCount} times
                          </span>
                          {template.lastUsed && (
                            <span>
                              Last: {format(new Date(template.lastUsed), 'MMM d')}
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleUseTemplate(template)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Content Automation</CardTitle>
              <CardDescription className="text-gray-400">
                Set up automated workflows and rules for your content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Auto-Welcome Messages */}
              <Card className="bg-gray-700 border-gray-600">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-white flex items-center">
                        <BellRing className="w-4 h-4 mr-2 text-primary" />
                        Auto-Welcome Messages
                      </h4>
                      <p className="text-sm text-gray-400 mt-1">
                        Automatically send welcome messages to new subscribers
                      </p>
                    </div>
                    <Switch className="data-[state=checked]:bg-primary" />
                  </div>
                  <Textarea
                    placeholder="Welcome to my exclusive content! 💕 Thanks for subscribing..."
                    className="bg-gray-800 border-gray-600 text-white"
                    rows={3}
                  />
                </CardContent>
              </Card>
              
              {/* Recurring Posts */}
              <Card className="bg-gray-700 border-gray-600">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-white flex items-center">
                        <Repeat className="w-4 h-4 mr-2 text-primary" />
                        Recurring Posts
                      </h4>
                      <p className="text-sm text-gray-400 mt-1">
                        Schedule posts to repeat at regular intervals
                      </p>
                    </div>
                    <Switch className="data-[state=checked]:bg-primary" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Select defaultValue="weekly">
                        <SelectTrigger className="w-[140px] bg-gray-800 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="text"
                        placeholder="Post title template..."
                        className="bg-gray-800 border-gray-600 text-white flex-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Content Expiry */}
              <Card className="bg-gray-700 border-gray-600">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-white flex items-center">
                        <Timer className="w-4 h-4 mr-2 text-primary" />
                        Content Expiry
                      </h4>
                      <p className="text-sm text-gray-400 mt-1">
                        Automatically remove or archive old content
                      </p>
                    </div>
                    <Switch className="data-[state=checked]:bg-primary" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">Auto-archive content after</span>
                    <Input
                      type="number"
                      defaultValue="30"
                      className="bg-gray-800 border-gray-600 text-white w-20"
                    />
                    <span className="text-sm text-gray-400">days</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Smart Pricing */}
              <Card className="bg-gray-700 border-gray-600">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-white flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-primary" />
                        Smart Pricing
                      </h4>
                      <p className="text-sm text-gray-400 mt-1">
                        Automatically adjust PPV prices based on demand
                      </p>
                    </div>
                    <Switch className="data-[state=checked]:bg-primary" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Minimum price</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">$</span>
                        <Input
                          type="number"
                          defaultValue="4.99"
                          className="bg-gray-800 border-gray-600 text-white w-24"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Maximum price</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">$</span>
                        <Input
                          type="number"
                          defaultValue="49.99"
                          className="bg-gray-800 border-gray-600 text-white w-24"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Schedule Post Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Schedule New Post</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create and schedule content to be published automatically
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-white">Title</Label>
              <Input
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="Enter post title..."
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <div>
              <Label className="text-white">Content</Label>
              <Textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Write your post content..."
                className="bg-gray-700 border-gray-600 text-white"
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Media Type</Label>
                <Select value={postMediaType} onValueChange={(v: any) => setPostMediaType(v)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="text">Text Only</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-white">Visibility</Label>
                <Select value={postVisibility} onValueChange={(v: any) => setPostVisibility(v)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="subscription">Subscription Only</SelectItem>
                    <SelectItem value="ppv">Pay-Per-View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {postVisibility === "ppv" && (
              <div>
                <Label className="text-white">PPV Price</Label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">$</span>
                  <Input
                    type="number"
                    value={postPpvPrice}
                    onChange={(e) => setPostPpvPrice(parseFloat(e.target.value) || 0)}
                    className="bg-gray-700 border-gray-600 text-white"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Schedule Date</Label>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'PPP')}
                </Button>
              </div>
              
              <div>
                <Label className="text-white">Time</Label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-white">Enable recurring posts</Label>
              <Switch
                checked={recurringEnabled}
                onCheckedChange={setRecurringEnabled}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            
            {recurringEnabled && (
              <div>
                <Label className="text-white">Recurring Frequency</Label>
                <Select value={recurringFrequency} onValueChange={(v: any) => setRecurringFrequency(v)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <Label className="text-white">Auto-delete after period</Label>
              <Switch
                checked={postAutoDelete}
                onCheckedChange={setPostAutoDelete}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            
            {postAutoDelete && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Delete after</span>
                <Input
                  type="number"
                  value={postAutoDeleteDays}
                  onChange={(e) => setPostAutoDeleteDays(parseInt(e.target.value) || 30)}
                  className="bg-gray-700 border-gray-600 text-white w-20"
                  min="1"
                />
                <span className="text-sm text-gray-400">days</span>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowScheduleDialog(false)}
              className="text-gray-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSchedulePost}
              className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
              disabled={schedulePostMutation.isPending}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Schedule Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}