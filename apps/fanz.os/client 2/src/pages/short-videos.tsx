import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ShortVideoFeed from "@/components/short-video-feed";
import ShortVideoUpload from "@/components/short-video-upload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Video, Sparkles } from "lucide-react";

export default function ShortVideosPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showUpload, setShowUpload] = useState(false);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <Video size={64} className="mx-auto text-primary mb-4" />
              <h1 className="text-3xl font-bold mb-2">FansLab Videos</h1>
              <p className="text-muted-foreground">
                Discover amazing short videos from creators around the world
              </p>
            </div>
            
            <div className="space-y-4">
              <Button 
                onClick={() => window.location.href = '/api/login'}
                className="w-full"
                size="lg"
                data-testid="login-button"
              >
                Login to Watch Videos
              </Button>
              
              <div className="text-sm text-muted-foreground">
                Join FansLab to discover exclusive content and support your favorite creators
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleUploadComplete = (videoId: string) => {
    setShowUpload(false);
    // Optionally navigate to the uploaded video or refresh feed
    console.log('Video uploaded:', videoId);
  };

  return (
    <div className="h-screen w-full bg-black relative overflow-hidden" data-testid="short-videos-page">
      {/* Main Video Feed */}
      <ShortVideoFeed className="h-full" />

      {/* Upload Dialog for Creators */}
      {user?.role === 'creator' && (
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="fixed top-4 right-4 z-30 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
              data-testid="open-upload-dialog"
            >
              <Upload size={20} className="mr-2" />
              Upload
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Sparkles className="text-primary" />
                <span>Create Short Video</span>
              </DialogTitle>
            </DialogHeader>
            <ShortVideoUpload
              onUploadComplete={handleUploadComplete}
              onCancel={() => setShowUpload(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Creator Call-to-Action for Fans */}
      {user?.role === 'fanz' && (
        <div className="fixed bottom-4 left-4 right-4 z-30">
          <Card className="bg-gradient-to-r from-primary/90 to-secondary/90 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <h3 className="font-semibold">Become a Creator</h3>
                  <p className="text-sm text-white/80">Start creating and earning with your content</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => window.location.href = '/upgrade-to-creator'}
                  data-testid="upgrade-to-creator-button"
                >
                  Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col space-y-3">
        {/* AI Content Assistant for Creators */}
        {user?.role === 'creator' && (
          <Button
            size="lg"
            variant="outline"
            className="rounded-full bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-white/10"
            onClick={() => window.location.href = '/ai-assistant'}
            data-testid="ai-assistant-button"
          >
            <Sparkles size={20} />
          </Button>
        )}
      </div>

    </div>
  );
}