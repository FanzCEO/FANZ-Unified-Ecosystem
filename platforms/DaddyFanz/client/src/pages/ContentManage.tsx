import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Upload, 
  Search, 
  Filter, 
  Image, 
  Video, 
  Edit, 
  Trash2, 
  Eye, 
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Star,
  Grid,
  List
} from "lucide-react";

interface MediaAsset {
  id: string;
  title: string;
  description: string;
  mimeType: string;
  fileSize: number;
  status: "uploaded" | "processing" | "approved" | "rejected";
  price?: number;
  isPremium: boolean;
  s3Key: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContentManage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch user's media assets
  const { data: mediaAssets = [], isLoading } = useQuery({
    queryKey: ["/api/media"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/media");
      return response.json();
    }
  });

  // Delete media mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/media/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Content Deleted",
        description: "Your content has been successfully deleted."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete content. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Filter media assets
  const filteredAssets = mediaAssets.filter((asset: MediaAsset) => {
    const matchesSearch = asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-600";
      case "rejected": return "bg-red-600";
      case "processing": return "bg-yellow-600";
      default: return "bg-slate-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-4 w-4" />;
      case "rejected": return <XCircle className="h-4 w-4" />;
      case "processing": return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Content Management</h1>
              <p className="text-slate-300">Manage your uploaded content and track moderation status</p>
            </div>
            <Button
              onClick={() => navigate("/content-upload")}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              data-testid="button-upload-new"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload New Content
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="border-slate-700 bg-slate-800/50 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Filter & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white"
                    data-testid="input-search"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white" data-testid="select-status">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="uploaded">Uploaded</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex border border-slate-600 rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                    data-testid="button-grid-view"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none"
                    data-testid="button-list-view"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Image className="h-8 w-8 text-cyan-400" />
                <div className="ml-4">
                  <p className="text-slate-400 text-sm">Total Content</p>
                  <p className="text-2xl font-bold text-white">{mediaAssets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-400" />
                <div className="ml-4">
                  <p className="text-slate-400 text-sm">Approved</p>
                  <p className="text-2xl font-bold text-white">
                    {mediaAssets.filter((asset: MediaAsset) => asset.status === "approved").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-400" />
                <div className="ml-4">
                  <p className="text-slate-400 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-white">
                    {mediaAssets.filter((asset: MediaAsset) => asset.status === "processing" || asset.status === "uploaded").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-purple-400" />
                <div className="ml-4">
                  <p className="text-slate-400 text-sm">Premium</p>
                  <p className="text-2xl font-bold text-white">
                    {mediaAssets.filter((asset: MediaAsset) => asset.isPremium).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid/List */}
        {filteredAssets.length === 0 ? (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="p-12 text-center">
              <Upload className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No Content Found</h3>
              <p className="text-slate-400 mb-6">
                {searchTerm || statusFilter !== "all" 
                  ? "No content matches your current filters." 
                  : "Upload your first piece of content to get started."}
              </p>
              <Button
                onClick={() => navigate("/content-upload")}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                data-testid="button-upload-first"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Content
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "space-y-4"
          }>
            {filteredAssets.map((asset: MediaAsset) => (
              <Card key={asset.id} className="border-slate-700 bg-slate-800/50 hover:bg-slate-800/70 transition-colors">
                <CardContent className={viewMode === "grid" ? "p-4" : "p-6"}>
                  {viewMode === "grid" ? (
                    <>
                      {/* Grid View */}
                      <div className="aspect-video bg-slate-700 rounded-lg mb-4 flex items-center justify-center">
                        {asset.mimeType.startsWith('image/') ? (
                          <Image className="h-12 w-12 text-slate-400" />
                        ) : (
                          <Video className="h-12 w-12 text-slate-400" />
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium text-white truncate" title={asset.title}>
                            {asset.title}
                          </h3>
                          {asset.isPremium && <Star className="h-4 w-4 text-purple-400 flex-shrink-0 ml-2" />}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(asset.status)} text-white`}>
                            {getStatusIcon(asset.status)}
                            <span className="ml-1 capitalize">{asset.status}</span>
                          </Badge>
                          {asset.price && (
                            <Badge variant="outline" className="border-green-600 text-green-400">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {asset.price}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-slate-400">
                          {formatFileSize(asset.fileSize)} • {formatDate(asset.createdAt)}
                        </p>
                        
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-400 hover:text-red-300"
                            onClick={() => deleteMutation.mutate(asset.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* List View */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          {asset.mimeType.startsWith('image/') ? (
                            <Image className="h-8 w-8 text-slate-400" />
                          ) : (
                            <Video className="h-8 w-8 text-slate-400" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-white truncate">{asset.title}</h3>
                            {asset.isPremium && <Star className="h-4 w-4 text-purple-400" />}
                          </div>
                          <p className="text-sm text-slate-400 truncate mb-2">{asset.description}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span>{formatFileSize(asset.fileSize)}</span>
                            <span>{formatDate(asset.createdAt)}</span>
                            {asset.price && (
                              <span className="text-green-400">${asset.price}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <Badge className={`${getStatusColor(asset.status)} text-white`}>
                            {getStatusIcon(asset.status)}
                            <span className="ml-1 capitalize">{asset.status}</span>
                          </Badge>
                          
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-400 hover:text-red-300"
                              onClick={() => deleteMutation.mutate(asset.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}