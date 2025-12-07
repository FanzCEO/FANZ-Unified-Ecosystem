import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Play,
  Eye,
  Clock,
  Archive,
  Image,
  Video,
  Upload,
  Star,
  Users,
  TrendingUp,
  Heart,
  MessageCircle
} from "lucide-react";

export default function Stories() {
  const { user } = useAuth();
  const [activeStoryView, setActiveStoryView] = useState<any>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [duration, setDuration] = useState(5);
  const [saveToHighlights, setSaveToHighlights] = useState(false);
  const [highlightCategory, setHighlightCategory] = useState("");

  // Mock data - in production, fetch from API
  const activeStories = [
    {
      id: "1",
      mediaUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
      mediaType: "image",
      caption: "Behind the scenes of today's photoshoot! 📸",
      viewCount: 234,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000),
    },
    {
      id: "2",
      mediaUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
      mediaType: "image",
      caption: "Q&A session tonight at 8 PM! Drop your questions 💬",
      viewCount: 189,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 19 * 60 * 60 * 1000),
    },
  ];

  const highlights = [
    {
      id: "h1",
      category: "Workouts",
      coverUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b",
      storyCount: 12,
    },
    {
      id: "h2",
      category: "Travel",
      coverUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828",
      storyCount: 8,
    },
    {
      id: "h3",
      category: "Tutorials",
      coverUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c",
      storyCount: 15,
    },
    {
      id: "h4",
      category: "BTS",
      coverUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7",
      storyCount: 6,
    },
  ];

  const stats = {
    totalViews: 12456,
    avgViewsPerStory: 423,
    completionRate: 87,
    totalStories: 234,
  };

  const timeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent mb-2">
              Stories
            </h1>
            <p className="text-gray-400">Share moments that disappear after 24 hours</p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Story
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-zinc-900 border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Views</p>
                <h3 className="text-2xl font-bold text-white">{stats.totalViews.toLocaleString()}</h3>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-2 flex items-center text-green-500 text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              +12% from last week
            </div>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Avg Views</p>
                <h3 className="text-2xl font-bold text-white">{stats.avgViewsPerStory}</h3>
              </div>
              <TrendingUp className="h-8 w-8 text-cyan-500" />
            </div>
            <p className="mt-2 text-gray-400 text-sm">Per story</p>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Completion Rate</p>
                <h3 className="text-2xl font-bold text-white">{stats.completionRate}%</h3>
              </div>
              <Play className="h-8 w-8 text-pink-500" />
            </div>
            <div className="mt-2 w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Stories</p>
                <h3 className="text-2xl font-bold text-white">{stats.totalStories}</h3>
              </div>
              <Image className="h-8 w-8 text-yellow-500" />
            </div>
            <p className="mt-2 text-gray-400 text-sm">All time</p>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="active" className="data-[state=active]:bg-purple-600">
              <Play className="h-4 w-4 mr-2" />
              Active Stories ({activeStories.length})
            </TabsTrigger>
            <TabsTrigger value="highlights" className="data-[state=active]:bg-purple-600">
              <Star className="h-4 w-4 mr-2" />
              Highlights ({highlights.length})
            </TabsTrigger>
            <TabsTrigger value="expired" className="data-[state=active]:bg-purple-600">
              <Archive className="h-4 w-4 mr-2" />
              Expired
            </TabsTrigger>
          </TabsList>

          {/* Active Stories */}
          <TabsContent value="active" className="mt-6">
            {activeStories.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800 p-12 text-center">
                <Image className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Active Stories</h3>
                <p className="text-gray-500 mb-6">Create your first story to start engaging with your fans</p>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Story
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeStories.map((story) => (
                  <Card
                    key={story.id}
                    className="bg-zinc-900 border-zinc-800 overflow-hidden hover:border-purple-500 transition-all cursor-pointer group"
                    onClick={() => setActiveStoryView(story)}
                  >
                    <div className="relative aspect-[9/16] overflow-hidden">
                      <img
                        src={story.mediaUrl}
                        alt="Story"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Story Caption Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-white text-sm mb-3">{story.caption}</p>

                        <div className="flex items-center justify-between text-xs text-gray-300">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center">
                              <Eye className="h-3 w-3 mr-1" />
                              {story.viewCount}
                            </span>
                            <span className="flex items-center">
                              <Heart className="h-3 w-3 mr-1" />
                              {Math.floor(story.viewCount * 0.3)}
                            </span>
                            <span className="flex items-center">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              {Math.floor(story.viewCount * 0.15)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Time Remaining Badge */}
                      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
                        <Clock className="h-3 w-3 text-cyan-400" />
                        <span className="text-xs text-white font-medium">
                          {timeRemaining(story.expiresAt)}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 border-t border-zinc-800">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">
                          Posted {new Date(story.createdAt).toLocaleString()}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-purple-400 hover:text-purple-300"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Highlights */}
          <TabsContent value="highlights" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {highlights.map((highlight) => (
                <div key={highlight.id} className="group cursor-pointer">
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 ring-2 ring-purple-600 ring-offset-2 ring-offset-black">
                    <img
                      src={highlight.coverUrl}
                      alt={highlight.category}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 text-center">
                      <span className="text-white text-xs font-medium">
                        {highlight.storyCount} stories
                      </span>
                    </div>
                  </div>
                  <p className="text-center text-sm font-medium text-white">{highlight.category}</p>
                </div>
              ))}

              {/* Add New Highlight */}
              <div className="group cursor-pointer">
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-2 border-dashed border-purple-600 flex items-center justify-center hover:from-purple-900/30 hover:to-pink-900/30 transition-all">
                  <Plus className="h-12 w-12 text-purple-400" />
                </div>
                <p className="text-center text-sm font-medium text-gray-400">New Category</p>
              </div>
            </div>
          </TabsContent>

          {/* Expired Stories */}
          <TabsContent value="expired" className="mt-6">
            <Card className="bg-zinc-900 border-zinc-800 p-12 text-center">
              <Archive className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">Expired Stories</h3>
              <p className="text-gray-500 mb-6">Stories older than 24 hours appear here. You can save them to highlights.</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Story Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Create New Story
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Media Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Media Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMediaType("image")}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    mediaType === "image"
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <Image className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                  <span className="block text-sm font-medium">Image</span>
                  <span className="block text-xs text-gray-400 mt-1">JPG, PNG</span>
                </button>
                <button
                  onClick={() => setMediaType("video")}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    mediaType === "video"
                      ? "border-pink-500 bg-pink-500/10"
                      : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <Video className="h-8 w-8 mx-auto mb-2 text-pink-400" />
                  <span className="block text-sm font-medium">Video</span>
                  <span className="block text-xs text-gray-400 mt-1">MP4, MOV</span>
                </button>
              </div>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-zinc-700 rounded-lg p-12 text-center hover:border-purple-500 transition-colors cursor-pointer">
              <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-300 font-medium mb-2">Click to upload or drag and drop</p>
              <p className="text-gray-500 text-sm">
                {mediaType === "image" ? "Max size: 10MB" : "Max size: 100MB, Max duration: 60s"}
              </p>
            </div>

            {/* Caption */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Caption (Optional)</label>
              <Textarea
                placeholder="Add a caption to your story..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 resize-none"
                rows={3}
              />
            </div>

            {/* Duration (for images) */}
            {mediaType === "image" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Duration: {duration} seconds
                </label>
                <input
                  type="range"
                  min="3"
                  max="15"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>3s</span>
                  <span>15s</span>
                </div>
              </div>
            )}

            {/* Save to Highlights */}
            <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-white">Save to Highlights</p>
                  <p className="text-xs text-gray-400">Keep this story visible after 24 hours</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={saveToHighlights}
                onChange={(e) => setSaveToHighlights(e.target.checked)}
                className="w-5 h-5 accent-purple-600"
              />
            </div>

            {saveToHighlights && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Highlight Category</label>
                <Select value={highlightCategory} onValueChange={setHighlightCategory}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Choose or create category" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectItem value="workouts">Workouts</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="tutorials">Tutorials</SelectItem>
                    <SelectItem value="bts">Behind The Scenes</SelectItem>
                    <SelectItem value="new">+ Create New Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-zinc-700 hover:bg-zinc-800"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => {
                  // Handle story creation
                  setCreateDialogOpen(false);
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                Publish Story
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
