import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Sidebar } from "@/components/layout/Sidebar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Shield, 
  Check, 
  X, 
  Flag, 
  Eye, 
  AlertTriangle,
  Clock,
  Image as ImageIcon
} from "lucide-react";

export default function Moderation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  // Redirect if not admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gf-ink text-gf-snow flex items-center justify-center">
        <Card className="glass-overlay border-gf-smoke/20 p-8">
          <div className="text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-error" />
            <h1 className="text-2xl font-bold text-gf-snow mb-2">Access Denied</h1>
            <p className="text-gf-smoke">You need administrator privileges to access this page.</p>
          </div>
        </Card>
      </div>
    );
  }

  const { data: moderationQueue, isLoading } = useQuery({
    queryKey: ["/api/moderation/queue", selectedStatus === "all" ? "" : selectedStatus],
  });

  const reviewItemMutation = useMutation({
    mutationFn: async ({ itemId, status, notes }: { itemId: string; status: string; notes?: string }) => {
      const response = await apiRequest("PATCH", `/api/moderation/${itemId}`, { status, notes });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Content review completed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/queue"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
        title: "Error",
        description: "Failed to update moderation status.",
        variant: "destructive",
      });
    },
  });

  const handleReview = (itemId: string, status: string) => {
    const notes = reviewNotes[itemId] || "";
    reviewItemMutation.mutate({ itemId, status, notes });
    setReviewNotes({ ...reviewNotes, [itemId]: "" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning";
      case "approved":
        return "bg-success";
      case "rejected":
        return "bg-error";
      case "flagged":
        return "bg-gf-violet";
      default:
        return "bg-gf-smoke";
    }
  };

  const getAIConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-success";
    if (confidence >= 70) return "text-warning";
    return "text-error";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gf-ink text-gf-snow flex items-center justify-center">
        <div className="text-xl">Loading moderation queue...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="glass-overlay border-gf-smoke/20">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-display font-bold text-2xl text-gf-snow flex items-center">
                    <Shield className="h-8 w-8 mr-3 text-gf-violet" />
                    Content Moderation Queue
                  </h2>
                  <div className="flex items-center space-x-4">
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="bg-gf-graphite border-gf-smoke/20 text-gf-snow w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gf-graphite border-gf-smoke/20">
                        <SelectItem value="all">All Content</SelectItem>
                        <SelectItem value="pending">Pending Review</SelectItem>
                        <SelectItem value="flagged">Flagged Content</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2 text-sm text-gf-smoke">
                      <span>Queue Status:</span>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-warning rounded-full mr-1" />
                        <span data-testid="queue-count">
                          {moderationQueue?.filter((item: any) => item.status === 'pending').length || 0} pending
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {moderationQueue && moderationQueue.length > 0 ? (
                    moderationQueue.map((item: any) => (
                      <Card key={item.id} className="glass-overlay border-gf-smoke/10">
                        <CardContent className="p-6">
                          <div className="grid lg:grid-cols-4 gap-6 items-center">
                            {/* Content Preview */}
                            <div className="lg:col-span-1">
                              <div className="relative rounded-lg overflow-hidden">
                                <div className="w-full h-32 bg-gradient-to-br from-gf-pink/20 to-gf-violet/20 flex items-center justify-center">
                                  <ImageIcon className="h-16 w-16 text-gf-smoke" />
                                </div>
                                <div className="absolute top-2 left-2">
                                  <Badge className={`${getStatusColor(item.status)} text-xs px-2 py-1 text-gf-snow`}>
                                    {item.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Content Details */}
                            <div className="lg:col-span-2 space-y-3">
                              <div className="flex items-center space-x-4">
                                <h3 className="font-semibold text-gf-snow" data-testid={`content-title-${item.id}`}>
                                  {item.media?.title || "Untitled Content"}
                                </h3>
                                <Badge className="text-xs bg-gf-violet px-2 py-1 text-gf-snow">
                                  {item.media?.mimeType?.split('/')[0] || "media"}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gf-smoke">
                                <span>Creator: <span className="text-gf-pink">User {item.media?.ownerId?.slice(-4)}</span></span>
                                <span>Uploaded: <span>{new Date(item.createdAt).toLocaleDateString()}</span></span>
                                <span>Reports: <span className="text-warning">{item.reportCount || 0}</span></span>
                              </div>
                              <p className="text-sm text-gf-smoke">
                                {item.media?.description || "No description provided"}
                              </p>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gf-smoke">AI Confidence:</span>
                                <div className="flex-1 bg-gf-graphite rounded-full h-2 max-w-32">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      item.aiConfidence >= 90 ? 'bg-success' : 
                                      item.aiConfidence >= 70 ? 'bg-warning' : 'bg-error'
                                    }`}
                                    style={{ width: `${item.aiConfidence || 0}%` }}
                                  />
                                </div>
                                <span className={`text-xs ${getAIConfidenceColor(item.aiConfidence || 0)}`}>
                                  {item.aiConfidence || 0}% Safe
                                </span>
                              </div>

                              {/* Review Notes Input */}
                              {item.status === 'pending' && (
                                <div className="mt-4">
                                  <Textarea
                                    placeholder="Add review notes (optional)..."
                                    value={reviewNotes[item.id] || ""}
                                    onChange={(e) => setReviewNotes({ ...reviewNotes, [item.id]: e.target.value })}
                                    className="bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke text-sm h-20"
                                    data-testid={`textarea-notes-${item.id}`}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="lg:col-span-1 flex flex-col space-y-3">
                              {item.status === 'pending' ? (
                                <>
                                  <Button
                                    onClick={() => handleReview(item.id, 'approved')}
                                    disabled={reviewItemMutation.isPending}
                                    className="bg-success text-gf-snow hover:bg-success/80"
                                    data-testid={`button-approve-${item.id}`}
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    onClick={() => handleReview(item.id, 'rejected')}
                                    disabled={reviewItemMutation.isPending}
                                    className="bg-error text-gf-snow hover:bg-error/80"
                                    data-testid={`button-reject-${item.id}`}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                  <Button
                                    onClick={() => handleReview(item.id, 'flagged')}
                                    disabled={reviewItemMutation.isPending}
                                    className="bg-warning text-gf-ink hover:bg-warning/80"
                                    data-testid={`button-flag-${item.id}`}
                                  >
                                    <Flag className="h-4 w-4 mr-2" />
                                    Flag
                                  </Button>
                                </>
                              ) : (
                                <div className="text-center">
                                  <Badge className={`${getStatusColor(item.status)} text-sm px-3 py-2 text-gf-snow`}>
                                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                  </Badge>
                                  {item.reviewedAt && (
                                    <p className="text-xs text-gf-smoke mt-2">
                                      Reviewed: {new Date(item.reviewedAt).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              )}
                              <Button
                                variant="outline"
                                className="text-gf-cyan hover:text-gf-violet border-gf-cyan/20 hover:border-gf-violet/20"
                                data-testid={`button-details-${item.id}`}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Shield className="h-16 w-16 mx-auto mb-4 text-gf-smoke" />
                      <h3 className="text-xl font-semibold text-gf-snow mb-2">No Content to Review</h3>
                      <p className="text-gf-smoke">
                        {selectedStatus === "all" 
                          ? "The moderation queue is empty."
                          : `No ${selectedStatus} content found.`
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
