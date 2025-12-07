import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Sparkles, Hash, Calendar, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface HashtagSuggestion {
  tag: string;
  popularity: string;
  posts: number;
}

interface PostSuggestion {
  content: string;
  platform: string;
  tone: string;
}

interface UTMParams {
  url: string;
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
}

export default function SocialMediaTools() {
  const { toast } = useToast();
  const [postTopic, setPostTopic] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [tone, setTone] = useState("casual");
  const [hashtagKeyword, setHashtagKeyword] = useState("");
  const [generatedHashtags, setGeneratedHashtags] = useState<HashtagSuggestion[]>([]);
  const [generatedPosts, setGeneratedPosts] = useState<PostSuggestion[]>([]);
  const [utmParams, setUtmParams] = useState<UTMParams>({
    url: "",
    source: "",
    medium: "",
    campaign: ""
  });
  const [generatedURL, setGeneratedURL] = useState("");

  const generatePostMutation = useMutation({
    mutationFn: async (data: { topic: string; platform: string; tone: string }) => {
      const response = await apiRequest("POST", "/api/ai/generate-social-post", data);
      return await response.json();
    },
    onSuccess: (data: { posts: PostSuggestion[] }) => {
      setGeneratedPosts(data.posts);
      toast({
        title: "Posts Generated",
        description: "AI-powered social media posts created successfully!"
      });
    }
  });

  const generateHashtagsMutation = useMutation({
    mutationFn: async (data: { keyword: string; platform: string }) => {
      const response = await apiRequest("POST", "/api/ai/generate-hashtags", data);
      return await response.json();
    },
    onSuccess: (data: { hashtags: HashtagSuggestion[] }) => {
      setGeneratedHashtags(data.hashtags);
      toast({
        title: "Hashtags Generated",
        description: `Generated ${data.hashtags.length} relevant hashtags!`
      });
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard"
    });
  };

  const generateUTMURL = () => {
    const url = new URL(utmParams.url);
    url.searchParams.set('utm_source', utmParams.source);
    url.searchParams.set('utm_medium', utmParams.medium);
    url.searchParams.set('utm_campaign', utmParams.campaign);
    if (utmParams.term) url.searchParams.set('utm_term', utmParams.term);
    if (utmParams.content) url.searchParams.set('utm_content', utmParams.content);
    setGeneratedURL(url.toString());
  };

  const platformHashtagLimits = {
    instagram: { limit: 30, description: "Instagram allows up to 30 hashtags" },
    tiktok: { limit: 100, description: "TikTok allows up to 100 characters in hashtags" },
    youtube: { limit: 15, description: "YouTube recommends 10-15 hashtags max" },
    twitter: { limit: 280, description: "Twitter has 280 character limit total" }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Social Media Tools
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Free AI-powered tools to create engaging content, generate hashtags, schedule posts, and track campaigns
        </p>
      </div>

      <Tabs defaultValue="post-creator" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="post-creator" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Post Creator
          </TabsTrigger>
          <TabsTrigger value="hashtag-generator" className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Hashtag Generator
          </TabsTrigger>
          <TabsTrigger value="scheduler" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduler
          </TabsTrigger>
          <TabsTrigger value="utm-generator" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            UTM Generator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="post-creator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI Social Media Post Creator
              </CardTitle>
              <CardDescription>
                Generate engaging social media content with AI. Perfect for creators who need consistent, high-quality posts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="post-topic">Post Topic/Theme</Label>
                  <Input
                    id="post-topic"
                    placeholder="e.g., fitness motivation, beauty tips, behind the scenes"
                    value={postTopic}
                    onChange={(e) => setPostTopic(e.target.value)}
                    data-testid="input-post-topic"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform-select">Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger data-testid="select-platform">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="onlyfans">OnlyFans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tone-select">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger data-testid="select-tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casual">Casual & Friendly</SelectItem>
                      <SelectItem value="flirty">Flirty & Playful</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="mysterious">Mysterious</SelectItem>
                      <SelectItem value="humorous">Humorous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={() => generatePostMutation.mutate({ topic: postTopic, platform, tone })}
                disabled={!postTopic || generatePostMutation.isPending}
                className="w-full"
                data-testid="button-generate-posts"
              >
                {generatePostMutation.isPending ? "Generating..." : "Generate Posts"}
              </Button>

              {generatedPosts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Generated Posts</h3>
                  {generatedPosts.map((post, index) => (
                    <Card key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{post.platform}</Badge>
                              <Badge variant="secondary">{post.tone}</Badge>
                            </div>
                            <p className="text-sm whitespace-pre-wrap" data-testid={`text-generated-post-${index}`}>
                              {post.content}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(post.content)}
                            data-testid={`button-copy-post-${index}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hashtag-generator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-purple-600" />
                Hashtag Generator
              </CardTitle>
              <CardDescription>
                Generate relevant hashtags for maximum reach and engagement across different platforms.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hashtag-keyword">Keyword/Topic</Label>
                  <Input
                    id="hashtag-keyword"
                    placeholder="e.g., fitness, makeup, lingerie, workout"
                    value={hashtagKeyword}
                    onChange={(e) => setHashtagKeyword(e.target.value)}
                    data-testid="input-hashtag-keyword"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hashtag-platform">Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger data-testid="select-hashtag-platform">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {platformHashtagLimits[platform as keyof typeof platformHashtagLimits] && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    💡 {platformHashtagLimits[platform as keyof typeof platformHashtagLimits].description}
                  </p>
                </div>
              )}

              <Button
                onClick={() => generateHashtagsMutation.mutate({ keyword: hashtagKeyword, platform })}
                disabled={!hashtagKeyword || generateHashtagsMutation.isPending}
                className="w-full"
                data-testid="button-generate-hashtags"
              >
                {generateHashtagsMutation.isPending ? "Generating..." : "Generate Hashtags"}
              </Button>

              {generatedHashtags.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Generated Hashtags</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedHashtags.map(h => h.tag).join(' '))}
                      data-testid="button-copy-all-hashtags"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy All
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {generatedHashtags.map((hashtag, index) => (
                      <Card key={index} className="cursor-pointer hover:bg-accent transition-colors">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-mono text-sm text-purple-600 dark:text-purple-400" data-testid={`text-hashtag-${index}`}>
                                {hashtag.tag}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {hashtag.popularity}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {hashtag.posts.toLocaleString()} posts
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(hashtag.tag)}
                              data-testid={`button-copy-hashtag-${index}`}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduler" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Social Media Scheduler
              </CardTitle>
              <CardDescription>
                Schedule your posts across multiple platforms for optimal engagement times.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 space-y-4">
                <Calendar className="h-16 w-16 mx-auto text-purple-600 opacity-50" />
                <h3 className="text-xl font-semibold">Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  The social media scheduler is integrated into your main dashboard. 
                  Go to your Creator Dashboard to schedule posts across platforms.
                </p>
                <Button variant="outline" data-testid="button-go-to-dashboard">
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utm-generator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                UTM Generator
              </CardTitle>
              <CardDescription>
                Create trackable URLs for your marketing campaigns and social media posts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="utm-url">Website URL *</Label>
                  <Input
                    id="utm-url"
                    placeholder="https://example.com"
                    value={utmParams.url}
                    onChange={(e) => setUtmParams({...utmParams, url: e.target.value})}
                    data-testid="input-utm-url"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utm-source">Campaign Source *</Label>
                  <Input
                    id="utm-source"
                    placeholder="instagram, tiktok, newsletter"
                    value={utmParams.source}
                    onChange={(e) => setUtmParams({...utmParams, source: e.target.value})}
                    data-testid="input-utm-source"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utm-medium">Campaign Medium *</Label>
                  <Input
                    id="utm-medium"
                    placeholder="social, email, video"
                    value={utmParams.medium}
                    onChange={(e) => setUtmParams({...utmParams, medium: e.target.value})}
                    data-testid="input-utm-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utm-campaign">Campaign Name *</Label>
                  <Input
                    id="utm-campaign"
                    placeholder="summer_promo, new_content"
                    value={utmParams.campaign}
                    onChange={(e) => setUtmParams({...utmParams, campaign: e.target.value})}
                    data-testid="input-utm-campaign"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utm-term">Campaign Term (optional)</Label>
                  <Input
                    id="utm-term"
                    placeholder="keywords for paid search"
                    value={utmParams.term}
                    onChange={(e) => setUtmParams({...utmParams, term: e.target.value})}
                    data-testid="input-utm-term"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utm-content">Campaign Content (optional)</Label>
                  <Input
                    id="utm-content"
                    placeholder="ad_version_a, header_link"
                    value={utmParams.content}
                    onChange={(e) => setUtmParams({...utmParams, content: e.target.value})}
                    data-testid="input-utm-content"
                  />
                </div>
              </div>

              <Button
                onClick={generateUTMURL}
                disabled={!utmParams.url || !utmParams.source || !utmParams.medium || !utmParams.campaign}
                className="w-full"
                data-testid="button-generate-utm"
              >
                Generate UTM URL
              </Button>

              {generatedURL && (
                <div className="space-y-3">
                  <Label>Generated UTM URL</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={generatedURL} 
                      readOnly 
                      className="font-mono text-sm"
                      data-testid="input-generated-utm"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(generatedURL)}
                      data-testid="button-copy-utm"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      ✅ Use this URL in your campaigns to track traffic sources in Google Analytics.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}