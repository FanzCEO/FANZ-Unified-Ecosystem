import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CreateContentModal } from "@/components/modals/create-content-modal";
import { Plus, MoreHorizontal, Eye, Heart, MessageCircle } from "lucide-react";

export default function Content() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["/api/posts"],
    retry: false,
  });

  if (isLoading || postsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <MobileNav />
      
      <div className="lg:pl-64 pb-20 lg:pb-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Content Management</h1>
              <p className="text-sm text-muted-foreground" data-testid="text-page-description">
                Create and manage your posts
              </p>
            </div>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="gradient-bg hover:opacity-90 transition-opacity"
              data-testid="button-create-content"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          </div>
        </header>

        {/* Content Grid */}
        <main className="p-4 lg:p-6">
          {(posts || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="grid-posts">
              {(posts || []).map((post: any) => (
                <Card key={post.id} className="bg-card border-border overflow-hidden" data-testid={`card-post-${post.id}`}>
                  {post.mediaUrl && (
                    <div className="aspect-video bg-muted">
                      <img 
                        src={post.mediaUrl} 
                        alt={post.title} 
                        className="w-full h-full object-cover"
                        data-testid={`img-post-media-${post.id}`}
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold truncate" data-testid={`text-post-title-${post.id}`}>
                        {post.title || 'Untitled Post'}
                      </h3>
                      <button className="p-1 hover:bg-accent/10 rounded" data-testid={`button-post-menu-${post.id}`}>
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {post.content && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-post-content-${post.id}`}>
                        {post.content}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center" data-testid={`stat-post-views-${post.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          {post.views}
                        </span>
                        <span className="flex items-center" data-testid={`stat-post-likes-${post.id}`}>
                          <Heart className="w-4 h-4 mr-1" />
                          {post.likes}
                        </span>
                        <span className="flex items-center" data-testid={`stat-post-comments-${post.id}`}>
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {post.comments}
                        </span>
                      </div>
                      <span className="text-green-500 font-medium" data-testid={`text-post-earnings-${post.id}`}>
                        ${post.earnings}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        post.visibility === 'public' ? 'bg-green-500/10 text-green-500' :
                        post.visibility === 'subscribers' ? 'bg-primary/10 text-primary' :
                        'bg-accent/10 text-accent'
                      }`} data-testid={`badge-post-visibility-${post.id}`}>
                        {post.visibility === 'public' ? 'Public' : 
                         post.visibility === 'subscribers' ? 'Members Only' : 
                         `Pay-per-view ${post.price ? `$${post.price}` : ''}`}
                      </span>
                      <span className="text-xs text-muted-foreground" data-testid={`text-post-date-${post.id}`}>
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16" data-testid="empty-content">
              <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No content yet</h3>
              <p className="text-muted-foreground mb-6">
                Start creating amazing content for your fans
              </p>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="gradient-bg hover:opacity-90 transition-opacity"
                data-testid="button-create-first-content"
              >
                Create Your First Post
              </Button>
            </div>
          )}
        </main>
      </div>

      <CreateContentModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
}
