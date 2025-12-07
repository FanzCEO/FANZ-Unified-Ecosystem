import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar, 
  Image as ImageIcon, 
  Hash, 
  Sparkles, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  Clock,
  Send,
  Save,
  TrendingUp,
  Users,
  Eye,
  MessageCircle
} from "lucide-react";

export default function SocialScheduler() {
  const [postContent, setPostContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["twitter", "facebook"]);
  const [scheduleDate, setScheduleDate] = useState("");
  const { toast } = useToast();

  const enhanceMutation = useMutation({
    mutationFn: async (platform: string) => {
      const response = await apiRequest("POST", "/api/enhance/social", {
        content: postContent,
        platform
      });
      return response.json();
    },
    onSuccess: (data) => {
      setPostContent(data.content);
      toast({
        title: "Post Enhanced!",
        description: "Your social media post has been optimized with AI.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to enhance post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const platforms = [
    { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-600", bgColor: "hover:bg-blue-50" },
    { id: "twitter", name: "Twitter", icon: Twitter, color: "text-blue-400", bgColor: "hover:bg-blue-50" },
    { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-500", bgColor: "hover:bg-pink-50" },
    { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-700", bgColor: "hover:bg-blue-50" }
  ];

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const upcomingPosts = [
    {
      title: "Product Launch Announcement",
      time: "Today, 2:00 PM",
      platforms: ["twitter", "facebook"],
      color: "border-blue-500"
    },
    {
      title: "Customer Success Story",
      time: "Tomorrow, 10:00 AM",
      platforms: ["linkedin", "instagram"],
      color: "border-green-500"
    },
    {
      title: "Weekly Tips Thread",
      time: "Thursday, 9:00 AM",
      platforms: ["twitter"],
      color: "border-purple-500"
    }
  ];

  const performanceStats = [
    { label: "Total Reach", value: "24.7K", color: "text-primary" },
    { label: "Engagement Rate", value: "8.4%", color: "text-accent" },
    { label: "New Followers", value: "+342", color: "text-purple-500" },
    { label: "Click-throughs", value: "1.2K", color: "text-orange-500" }
  ];

  const contentIdeas = [
    "💡 '5 ways AI is transforming marketing'",
    "🎯 'Behind the scenes: Our automation process'",
    "📊 'Weekly marketing metrics breakdown'"
  ];

  return (
    <div className="min-h-screen bg-soft py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-3xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-poppins text-main mb-4">Social Media Scheduler</h1>
            <p className="text-gray-600">Plan, create, and automate your social media presence across all platforms</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Content Creator */}
            <div className="lg:col-span-2">
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-main">Create Post</CardTitle>
                    <div className="flex space-x-2">
                      {platforms.map((platform) => (
                        <Button
                          key={platform.id}
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePlatform(platform.id)}
                          className={`${platform.bgColor} ${selectedPlatforms.includes(platform.id) ? 'bg-opacity-20' : ''}`}
                          data-testid={`button-platform-${platform.id}`}
                        >
                          <platform.icon className={platform.color} size={20} />
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Textarea 
                      placeholder="What's happening? Let AI help you create engaging content..."
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      className="resize-none h-32"
                      data-testid="textarea-post-content"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm text-gray-500">
                        <span data-testid="text-character-count">{postContent.length}</span>/280 characters
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button variant="ghost" size="sm" data-testid="button-add-media">
                        <ImageIcon className="mr-2" size={16} />
                        Add Media
                      </Button>
                      <Button variant="ghost" size="sm" data-testid="button-add-hashtags">
                        <Hash className="mr-2" size={16} />
                        Tags
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => enhanceMutation.mutate("twitter")}
                        disabled={enhanceMutation.isPending || !postContent.trim()}
                        data-testid="button-ai-enhance"
                      >
                        <Sparkles className="mr-2" size={16} />
                        AI Enhance
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2">Schedule For</Label>
                      <Input 
                        type="datetime-local" 
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        data-testid="input-schedule-date"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2">Best Time</Label>
                      <Button 
                        variant="outline"
                        className="w-full bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                        data-testid="button-ai-suggest-time"
                      >
                        <Sparkles className="mr-2" size={16} />
                        AI Suggest
                      </Button>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button variant="outline" className="flex-1" data-testid="button-save-draft">
                      <Save className="mr-2" size={16} />
                      Save Draft
                    </Button>
                    <Button variant="outline" className="flex-1 bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100" data-testid="button-schedule-post">
                      <Calendar className="mr-2" size={16} />
                      Schedule Post
                    </Button>
                    <Button className="flex-1 bg-primary text-white hover:bg-indigo-600" data-testid="button-post-now">
                      <Send className="mr-2" size={16} />
                      Post Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Posts */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-main">Upcoming Posts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingPosts.map((post, index) => (
                    <div key={index} className={`border-l-4 ${post.color} pl-3`} data-testid={`upcoming-post-${index}`}>
                      <div className="text-sm font-medium text-main">{post.title}</div>
                      <div className="text-xs text-gray-500">{post.time}</div>
                      <div className="flex space-x-1 mt-1">
                        {post.platforms.map((platformId) => {
                          const platform = platforms.find(p => p.id === platformId);
                          return platform ? (
                            <platform.icon key={platformId} className={`${platform.color} text-xs`} size={12} />
                          ) : null;
                        })}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Performance Overview */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-main">This Week's Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {performanceStats.map((stat, index) => (
                    <div key={index} className="flex items-center justify-between" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                      <span className="text-gray-600">{stat.label}</span>
                      <span className={`font-semibold ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* AI Content Suggestions */}
              <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                <CardHeader>
                  <div className="flex items-center">
                    <Sparkles className="text-indigo-500 mr-2" size={20} />
                    <CardTitle className="text-lg text-main">Content Ideas</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {contentIdeas.map((idea, index) => (
                    <div 
                      key={index}
                      className="p-2 bg-white rounded-lg hover:bg-indigo-50 cursor-pointer transition-colors text-sm"
                      onClick={() => setPostContent(idea)}
                      data-testid={`content-idea-${index}`}
                    >
                      {idea}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
