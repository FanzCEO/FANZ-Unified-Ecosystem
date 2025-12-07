import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Lock,
  Unlock,
  DollarSign,
  Eye,
  ShoppingCart,
  TrendingUp,
  Image,
  Video,
  Package,
  Plus,
  Edit2,
  Trash2,
  Copy,
  CheckCircle2,
  Users,
  Star
} from "lucide-react";

export default function PPV() {
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [contentType, setContentType] = useState<"post" | "message" | "bundle">("post");
  const [price, setPrice] = useState("9.99");
  const [description, setDescription] = useState("");
  const [previewType, setPreviewType] = useState<"blurred" | "teaser" | "none">("blurred");

  // Mock PPV content data
  const ppvContent = [
    {
      id: "ppv1",
      title: "Exclusive Photoshoot Collection",
      type: "bundle",
      price: "19.99",
      purchaseCount: 156,
      revenue: "3074.44",
      previewUrl: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b",
      status: "active",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: "ppv2",
      title: "Behind The Scenes Video",
      type: "post",
      price: "12.99",
      purchaseCount: 234,
      revenue: "3039.66",
      previewUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4",
      status: "active",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: "ppv3",
      title: "Private Q&A Recording",
      type: "post",
      price: "7.99",
      purchaseCount: 89,
      revenue: "710.11",
      previewUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
      status: "active",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: "ppv4",
      title: "VIP Content Package",
      type: "bundle",
      price: "49.99",
      purchaseCount: 67,
      revenue: "3349.33",
      previewUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      status: "active",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
  ];

  const stats = {
    totalRevenue: ppvContent.reduce((sum, item) => sum + parseFloat(item.revenue), 0),
    totalPurchases: ppvContent.reduce((sum, item) => sum + item.purchaseCount, 0),
    activePPV: ppvContent.filter(item => item.status === "active").length,
    avgPrice: ppvContent.reduce((sum, item) => sum + parseFloat(item.price), 0) / ppvContent.length,
  };

  const recentPurchases = [
    {
      id: "p1",
      buyerName: "Sarah M.",
      contentTitle: "Exclusive Photoshoot Collection",
      amount: "19.99",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
    },
    {
      id: "p2",
      buyerName: "Mike R.",
      contentTitle: "Behind The Scenes Video",
      amount: "12.99",
      timestamp: new Date(Date.now() - 32 * 60 * 1000),
    },
    {
      id: "p3",
      buyerName: "Jessica L.",
      contentTitle: "Private Q&A Recording",
      amount: "7.99",
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
    },
    {
      id: "p4",
      buyerName: "David K.",
      contentTitle: "VIP Content Package",
      amount: "49.99",
      timestamp: new Date(Date.now() - 67 * 60 * 1000),
    },
  ];

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
              Pay-Per-View Content
            </h1>
            <p className="text-gray-400">Premium locked content for maximum earnings</p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create PPV Content
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-800/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
                <h3 className="text-3xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</h3>
              </div>
              <DollarSign className="h-10 w-10 text-yellow-500" />
            </div>
            <div className="flex items-center text-green-400 text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              +23% this month
            </div>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Purchases</p>
                <h3 className="text-3xl font-bold text-white">{stats.totalPurchases}</h3>
              </div>
              <ShoppingCart className="h-10 w-10 text-orange-500" />
            </div>
            <p className="text-gray-400 text-sm">Across all PPV content</p>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Active PPV</p>
                <h3 className="text-3xl font-bold text-white">{stats.activePPV}</h3>
              </div>
              <Lock className="h-10 w-10 text-red-500" />
            </div>
            <p className="text-gray-400 text-sm">Locked content items</p>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Avg Price</p>
                <h3 className="text-3xl font-bold text-white">${stats.avgPrice.toFixed(2)}</h3>
              </div>
              <Star className="h-10 w-10 text-purple-500" />
            </div>
            <p className="text-gray-400 text-sm">Per PPV item</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PPV Content List */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
                <TabsTrigger value="all" className="data-[state=active]:bg-yellow-600">
                  All Content
                </TabsTrigger>
                <TabsTrigger value="posts" className="data-[state=active]:bg-yellow-600">
                  <Image className="h-4 w-4 mr-2" />
                  Posts
                </TabsTrigger>
                <TabsTrigger value="bundles" className="data-[state=active]:bg-yellow-600">
                  <Package className="h-4 w-4 mr-2" />
                  Bundles
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {ppvContent.map((content) => (
                  <Card key={content.id} className="bg-zinc-900 border-zinc-800 overflow-hidden hover:border-yellow-600/50 transition-all">
                    <div className="flex gap-4 p-4">
                      {/* Preview Image */}
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={content.previewUrl}
                          alt={content.title}
                          className="w-full h-full object-cover filter blur-md"
                        />
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                          <Lock className="h-8 w-8 text-yellow-400" />
                        </div>
                        <div className="absolute top-2 right-2 bg-yellow-600 text-black text-xs font-bold px-2 py-1 rounded">
                          ${content.price}
                        </div>
                      </div>

                      {/* Content Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-1">{content.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center">
                                {content.type === "bundle" ? (
                                  <Package className="h-4 w-4 mr-1 text-purple-400" />
                                ) : (
                                  <Image className="h-4 w-4 mr-1 text-blue-400" />
                                )}
                                {content.type}
                              </span>
                              <span>{formatTimeAgo(content.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-400">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Purchases</p>
                            <p className="text-lg font-semibold text-white flex items-center">
                              <ShoppingCart className="h-4 w-4 mr-1 text-blue-400" />
                              {content.purchaseCount}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Revenue</p>
                            <p className="text-lg font-semibold text-green-400">
                              ${content.revenue}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Avg per sale</p>
                            <p className="text-lg font-semibold text-yellow-400">
                              ${content.price}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="border-t border-zinc-800 p-3 bg-zinc-900/50 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs font-medium">
                          Active
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">
                          Conversion: {((content.purchaseCount / 1000) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="border-zinc-700 text-sm">
                          <Eye className="h-3 w-3 mr-1" />
                          View Stats
                        </Button>
                        <Button size="sm" variant="outline" className="border-zinc-700 text-sm">
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Link
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="posts">
                <p className="text-gray-400 text-center py-12">Filter by post type content</p>
              </TabsContent>

              <TabsContent value="bundles">
                <p className="text-gray-400 text-center py-12">Filter by bundle type content</p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Recent Purchases Sidebar */}
          <div>
            <Card className="bg-zinc-900 border-zinc-800 p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Recent Purchases</h3>
                <Users className="h-5 w-5 text-yellow-500" />
              </div>

              <div className="space-y-4">
                {recentPurchases.map((purchase) => (
                  <div key={purchase.id} className="flex items-start gap-3 pb-4 border-b border-zinc-800 last:border-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-600 to-orange-600 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white mb-1">{purchase.buyerName}</p>
                      <p className="text-xs text-gray-400 truncate mb-2">{purchase.contentTitle}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-green-400">${purchase.amount}</span>
                        <span className="text-xs text-gray-500">{formatTimeAgo(purchase.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="w-full mt-6 bg-zinc-800 hover:bg-zinc-700 text-white">
                View All Purchases
              </Button>
            </Card>

            {/* Tips Card */}
            <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-800/30 p-6 mt-6">
              <h4 className="font-semibold text-white mb-3 flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                PPV Best Practices
              </h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>Price based on content value and exclusivity</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>Use teaser previews to drive curiosity</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>Bundle related content for higher prices</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>Promote PPV content in stories and posts</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {/* Create PPV Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Create PPV Content
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Content Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Content Type</label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: "post", label: "Single Post", icon: Image },
                  { value: "message", label: "DM Content", icon: Lock },
                  { value: "bundle", label: "Bundle", icon: Package },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setContentType(type.value as any)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      contentType === type.value
                        ? "border-yellow-500 bg-yellow-500/10"
                        : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    <type.icon className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
                    <span className="block text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <Input
                placeholder="e.g., Exclusive Behind The Scenes"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <Textarea
                placeholder="Describe what fans will get..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white resize-none"
                rows={3}
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Price (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white pl-10"
                  placeholder="9.99"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Recommended: $5-$50 for single content, $20-$100 for bundles</p>
            </div>

            {/* Preview Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Preview Type</label>
              <Select value={previewType} onValueChange={(value: any) => setPreviewType(value)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectItem value="blurred">Blurred Preview</SelectItem>
                  <SelectItem value="teaser">Teaser Clip</SelectItem>
                  <SelectItem value="none">No Preview</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Upload Content */}
            <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center">
              <Lock className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-300 mb-2">Upload your exclusive content</p>
              <p className="text-gray-500 text-sm">Images, videos, or multiple files for bundles</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-zinc-700"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600">
                <Lock className="mr-2 h-4 w-4" />
                Create PPV Content
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
