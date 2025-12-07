import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Check, 
  X, 
  Eye, 
  Filter, 
  AlertTriangle,
  Clock,
  User,
  Calendar,
  FileText,
  Settings,
  BarChart3,
  Shield,
  Zap,
  Search,
  SortAsc,
  Download,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";

interface ModerationItem {
  id: string;
  mediaId: string;
  status: "pending" | "approved" | "rejected";
  reviewerId?: string;
  notes?: string;
  priority: number;
  autoFlags?: any[];
  createdAt: string;
  updatedAt: string;
  media?: {
    id: string;
    title: string;
    mimeType: string;
    ownerId: string;
    s3Key: string;
  };
}

export default function ModerationQueue() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [severityFilter, setSeverityFilter] = useState<"all" | "low" | "medium" | "high" | "critical">("all");
  const [flagTypeFilter, setFlagTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"priority" | "created" | "confidence">("priority");
  const [searchQuery, setSearchQuery] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const { data: moderationQueue, isLoading } = useQuery({
    queryKey: ["/api/moderation/queue"],
    retry: false,
    enabled: user?.role === "admin",
  });

  const { data: moderationStats } = useQuery({
    queryKey: ["/api/moderation/stats"],
    retry: false,
    enabled: user?.role === "admin",
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, decision, notes }: { id: string; decision: "approve" | "reject"; notes: string }) => {
      const response = await apiRequest("PUT", `/api/moderation/${id}`, { decision, notes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/stats"] });
      toast({
        title: "Review Completed",
        description: "The content has been reviewed successfully.",
      });
      setSelectedItem(null);
      setReviewNotes("");
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Review Failed",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleReview = (decision: "approve" | "reject") => {
    if (!selectedItem) return;
    
    reviewMutation.mutate({
      id: selectedItem.id,
      decision,
      notes: reviewNotes,
    });
  };

  // Filter and sort moderation items
  const filteredItems = moderationQueue?.filter((item: ModerationItem) => {
    if (filter !== "all" && item.status !== filter) return false;
    
    // Severity filter
    if (severityFilter !== "all" && item.autoFlags) {
      const hasMatchingSeverity = item.autoFlags.some((flag: any) => flag.severity === severityFilter);
      if (!hasMatchingSeverity) return false;
    }
    
    // Flag type filter
    if (flagTypeFilter !== "all" && item.autoFlags) {
      const hasMatchingFlag = item.autoFlags.some((flag: any) => flag.type === flagTypeFilter);
      if (!hasMatchingFlag) return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        item.media?.title?.toLowerCase().includes(query) ||
        item.notes?.toLowerCase().includes(query) ||
        item.autoFlags?.some((flag: any) => flag.details?.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }
    
    return true;
  })?.sort((a: ModerationItem, b: ModerationItem) => {
    switch (sortBy) {
      case "priority":
        return (b.priority || 0) - (a.priority || 0);
      case "created":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "confidence":
        const aConfidence = a.autoFlags?.[0]?.confidence || 0;
        const bConfidence = b.autoFlags?.[0]?.confidence || 0;
        return bConfidence - aConfidence;
      default:
        return 0;
    }
  }) || [];

  const flagTypes = Array.from(
    new Set(
      moderationQueue?.flatMap((item: ModerationItem) => 
        item.autoFlags?.map((flag: any) => flag.type) || []
      ) || []
    )
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500 text-black">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-600 text-white">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-600 text-white">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 20) return "text-red-400";
    if (priority >= 15) return "text-orange-400";
    if (priority >= 10) return "text-yellow-400";
    if (priority >= 5) return "text-blue-400";
    return "text-df-fog";
  };

  const getPriorityIcon = (priority: number) => {
    if (priority >= 15) return <TrendingUp className="h-3 w-3" />;
    if (priority >= 10) return <AlertTriangle className="h-3 w-3" />;
    if (priority >= 5) return <Minus className="h-3 w-3" />;
    return <TrendingDown className="h-3 w-3" />;
  };

  const getContentTypeIcon = (mimeType?: string) => {
    if (!mimeType) return <FileText className="h-4 w-4" />;
    
    if (mimeType.startsWith("image/")) {
      return <div className="w-4 h-4 bg-df-cyan rounded text-xs flex items-center justify-center text-white">IMG</div>;
    } else if (mimeType.startsWith("video/")) {
      return <div className="w-4 h-4 bg-df-gold rounded text-xs flex items-center justify-center text-black">VID</div>;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-600 text-white";
      case "high": return "bg-orange-500 text-white";
      case "medium": return "bg-yellow-500 text-black";
      case "low": return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  if (user?.role !== "admin") {
    return (
      <Card className="card-df">
        <CardHeader>
          <CardTitle className="text-df-cyan">Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-df-fog">You must be an administrator to access the moderation queue.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-df mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="neon-heading flex items-center gap-3">
            <Shield className="h-6 w-6" />
            Content Moderation Queue
            <Badge variant="outline" className="ml-2 text-df-cyan border-df-cyan">
              {filteredItems.length} items
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              data-testid="button-toggle-stats"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Stats
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(!showConfig)}
              data-testid="button-toggle-config"
            >
              <Settings className="h-4 w-4 mr-1" />
              Config
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Enhanced Filtering Controls */}
        <div className="space-y-4 mb-6">
          {/* Search and Primary Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-df-cyan" />
              <input
                type="text"
                placeholder="Search content, notes, flags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-df text-sm flex-1"
                data-testid="input-search"
              />
            </div>
            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 text-df-cyan" />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input-df text-sm"
                data-testid="select-sort"
              >
                <option value="priority">Sort by Priority</option>
                <option value="created">Sort by Date</option>
                <option value="confidence">Sort by Confidence</option>
              </select>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-df-cyan" />
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value as any)}
                className="input-df text-sm"
                data-testid="select-status"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-df-gold" />
              <select 
                value={severityFilter} 
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="input-df text-sm"
                data-testid="select-severity"
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-df-cyan" />
              <select 
                value={flagTypeFilter} 
                onChange={(e) => setFlagTypeFilter(e.target.value)}
                className="input-df text-sm"
                data-testid="select-flag-type"
              >
                <option value="all">All Flag Types</option>
                {flagTypes.map(type => (
                  <option key={type} value={type}>
                    {type?.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Statistics Panel */}
        {showStats && moderationStats && (
          <div className="mb-6 p-4 bg-df-brick/50 rounded-lg border border-df-steel">
            <h3 className="text-df-gold font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Moderation Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-df-fog">Total Queued</div>
                <div className="text-df-cyan font-semibold text-lg">{moderationStats.totalQueued}</div>
              </div>
              <div>
                <div className="text-df-fog">Pending Review</div>
                <div className="text-df-gold font-semibold text-lg">{moderationStats.pendingReview}</div>
              </div>
              <div>
                <div className="text-df-fog">Auto Approved</div>
                <div className="text-green-400 font-semibold text-lg">{moderationStats.autoApproved}</div>
              </div>
              <div>
                <div className="text-df-fog">Auto Rejected</div>
                <div className="text-red-400 font-semibold text-lg">{moderationStats.autoRejected}</div>
              </div>
            </div>
            
            {/* Flag Breakdown */}
            {moderationStats.flagBreakdown && Object.keys(moderationStats.flagBreakdown).length > 0 && (
              <div className="mt-4">
                <h4 className="text-df-cyan font-medium mb-2">Flag Types Breakdown</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(moderationStats.flagBreakdown).map(([flag, count]) => (
                    <Badge key={flag} variant="outline" className="text-xs">
                      {flag?.replace('_', ' ')}: {count as number}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-df-fog">Loading moderation queue...</div>
          </div>
        ) : filteredItems.length > 0 ? (
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {filteredItems.map((item: ModerationItem) => (
                <div 
                  key={item.id}
                  className="bg-df-ink border border-df-steel rounded-md p-4 hover:border-df-cyan/50 transition-colors"
                  data-testid={`moderation-item-${item.id}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Content Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getContentTypeIcon(item.media?.mimeType)}
                    </div>
                    
                    {/* Content Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="text-df-snow font-medium truncate">
                          {item.media?.title || `Content #${item.mediaId.slice(-8)}`}
                        </h4>
                        {getStatusBadge(item.status)}
                        {item.priority > 0 && (
                          <div className={`flex items-center gap-1 ${getPriorityColor(item.priority)}`}>
                            {getPriorityIcon(item.priority)}
                            <span className="text-xs font-medium">P{item.priority}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-df-fog text-sm mb-3">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>Creator: {item.media?.ownerId?.slice(-8)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{item.media?.mimeType?.split('/')[0] || 'file'}</span>
                        </div>
                      </div>

                      {/* Enhanced Auto Flags Display */}
                      {item.autoFlags && item.autoFlags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.autoFlags.map((flag: any, index: number) => (
                            <Badge 
                              key={index} 
                              className={`text-xs ${getSeverityColor(flag.severity)}`}
                              title={flag.details}
                            >
                              {flag.type?.replace('_', ' ').toUpperCase()}: {Math.round(flag.confidence * 100)}%
                              {flag.severity && (
                                <span className="ml-1 text-xs opacity-75">
                                  [{flag.severity.toUpperCase()}]
                                </span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Review Notes */}
                      {item.notes && (
                        <div className="text-sm text-df-fog bg-df-brick/30 p-2 rounded">
                          <span className="font-medium">Review Notes: </span>
                          {item.notes}
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.status === "pending" && (
                        <>
                          <Button
                            onClick={() => {
                              setSelectedItem(item);
                              setReviewNotes("");
                            }}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            data-testid={`button-approve-${item.id}`}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedItem(item);
                              setReviewNotes("");
                            }}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            data-testid={`button-reject-${item.id}`}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="btn-outline"
                            data-testid={`button-review-${item.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-df-brick border border-df-steel max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-df-cyan">
                              Content Review - {item.media?.title || "Untitled"}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6">
                            {/* Content Preview Placeholder */}
                            <div className="bg-df-ink border border-df-steel rounded-md p-8 text-center">
                              {getContentTypeIcon(item.media?.mimeType)}
                              <p className="text-df-fog text-sm mt-2">Content preview would appear here</p>
                              <p className="text-df-fog text-xs">File: {item.media?.s3Key}</p>
                            </div>
                            
                            {/* Content Details */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-df-fog">Status:</span>
                                <span className="ml-2">{getStatusBadge(item.status)}</span>
                              </div>
                              <div>
                                <span className="text-df-fog">Priority:</span>
                                <span className={`ml-2 flex items-center gap-1 ${getPriorityColor(item.priority)}`}>
                                  {getPriorityIcon(item.priority)}
                                  {item.priority}
                                </span>
                              </div>
                              <div>
                                <span className="text-df-fog">Submitted:</span>
                                <span className="ml-2 text-df-snow">{new Date(item.createdAt).toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-df-fog">Type:</span>
                                <span className="ml-2 text-df-snow">{item.media?.mimeType}</span>
                              </div>
                            </div>

                            {/* Detailed Auto Flags */}
                            {item.autoFlags && item.autoFlags.length > 0 && (
                              <div className="bg-yellow-900/20 border border-yellow-600 rounded-md p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                  <span className="text-yellow-200 font-semibold">Auto-detected Issues</span>
                                </div>
                                <div className="space-y-3">
                                  {item.autoFlags.map((flag: any, index: number) => (
                                    <div key={index} className="bg-yellow-900/30 rounded p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <Badge className={getSeverityColor(flag.severity)}>
                                            {flag.type?.replace('_', ' ').toUpperCase()}
                                          </Badge>
                                          <span className="text-yellow-100 font-medium">
                                            {Math.round(flag.confidence * 100)}% confidence
                                          </span>
                                        </div>
                                        <Badge variant="outline" className="text-yellow-200">
                                          {flag.severity?.toUpperCase()} SEVERITY
                                        </Badge>
                                      </div>
                                      {flag.details && (
                                        <p className="text-yellow-100 text-sm">{flag.details}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Review Notes */}
                            <div>
                              <label className="text-df-fog text-sm font-medium">Review Notes</label>
                              <Textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Add detailed notes about your review decision..."
                                className="input-df mt-2"
                                rows={4}
                                data-testid="textarea-review-notes"
                              />
                            </div>

                            {/* Action Buttons */}
                            {item.status === "pending" && (
                              <div className="flex gap-3">
                                <Button
                                  onClick={() => handleReview("approve")}
                                  disabled={reviewMutation.isPending}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                  data-testid="button-approve-final"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  {reviewMutation.isPending ? "Processing..." : "Approve Content"}
                                </Button>
                                <Button
                                  onClick={() => handleReview("reject")}
                                  disabled={reviewMutation.isPending}
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                  data-testid="button-reject-final"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  {reviewMutation.isPending ? "Processing..." : "Reject Content"}
                                </Button>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12">
            <Shield className="h-16 w-16 text-df-fog mx-auto mb-4" />
            <h3 className="text-df-cyan text-lg font-semibold mb-2">
              {filter === "pending" ? "No Pending Reviews" : `No ${filter} Items`}
            </h3>
            <p className="text-df-fog">
              {filter === "pending" 
                ? "All content has been reviewed. Great work keeping the platform safe!"
                : `No ${filter} items match your current filters.`
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}