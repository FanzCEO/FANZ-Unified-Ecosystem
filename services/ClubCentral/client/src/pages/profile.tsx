import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Copy, Check, Instagram, Twitter } from "lucide-react";
import type { UploadResult } from '@uppy/core';

export default function Profile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    bio: "",
    subscriptionPrice: "",
    freeTrialDays: 0,
    profileImageUrl: "",
  });
  const [freeTrialEnabled, setFreeTrialEnabled] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

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

  const { data: creator, isLoading: creatorLoading } = useQuery({
    queryKey: ["/api/creator/profile"],
    retry: false,
  });

  const { data: subscribers } = useQuery({
    queryKey: ["/api/subscribers"],
    retry: false,
  });

  const { data: posts } = useQuery({
    queryKey: ["/api/posts"],
    retry: false,
  });

  // Initialize form data when creator data loads
  useEffect(() => {
    if (creator && typeof creator === 'object') {
      setFormData({
        displayName: creator?.displayName || "",
        username: creator?.username || "",
        bio: creator?.bio || "",
        subscriptionPrice: creator?.subscriptionPrice || "",
        freeTrialDays: creator?.freeTrialDays || 0,
        profileImageUrl: creator?.profileImageUrl || "",
      });
      setFreeTrialEnabled((creator?.freeTrialDays || 0) > 0);
    }
  }, [creator]);

  const updateCreatorMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/creator/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/profile"] });
      toast({
        title: "Profile updated",
        description: "Your creator profile has been updated successfully.",
      });
    },
    onError: (error) => {
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
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data = await response.json();
    return {
      method: 'PUT' as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const mediaURL = uploadedFile.uploadURL;
      
      try {
        const response = await apiRequest("PUT", "/api/content-media", {
          mediaURL,
          visibility: 'public'
        });
        const data = await response.json();
        
        setFormData(prev => ({
          ...prev,
          profileImageUrl: data.objectPath
        }));
        
        toast({
          title: "Profile image uploaded",
          description: "Your profile image has been uploaded successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process uploaded image.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      freeTrialDays: freeTrialEnabled ? formData.freeTrialDays : 0,
    };
    
    updateCreatorMutation.mutate(submitData);
  };

  const handleCopyLink = () => {
    const link = `fanz.app/${formData.username}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast({
      title: "Link copied",
      description: "Your FANZClub link has been copied to clipboard.",
    });
  };

  if (isLoading || creatorLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const subscriberCount = subscribers?.length || 0;
  const postCount = posts?.length || 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <MobileNav />
      
      <div className="lg:pl-64 pb-20 lg:pb-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Profile Management</h1>
              <p className="text-sm text-muted-foreground" data-testid="text-page-description">
                Customize your creator profile and settings
              </p>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Setup */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Info */}
                <Card className="bg-card border-border" data-testid="section-basic-info">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="displayName" className="text-sm font-medium mb-2 block">
                          Display Name
                        </Label>
                        <Input
                          id="displayName"
                          type="text"
                          value={formData.displayName}
                          onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                          className="bg-input border-border"
                          data-testid="input-display-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="username" className="text-sm font-medium mb-2 block">
                          Username
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">@</span>
                          <Input
                            id="username"
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                            className="pl-8 bg-input border-border"
                            data-testid="input-username"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="bio" className="text-sm font-medium mb-2 block">
                          Bio
                        </Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                          className="resize-none bg-input border-border"
                          rows={4}
                          data-testid="textarea-bio"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Profile Image
                        </Label>
                        <div className="flex items-center space-x-4">
                          {formData.profileImageUrl ? (
                            <img
                              src={formData.profileImageUrl}
                              alt="Profile"
                              className="w-16 h-16 rounded-full object-cover"
                              data-testid="img-current-profile"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-muted-foreground text-sm">No image</span>
                            </div>
                          )}
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={10485760}
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={handleUploadComplete}
                            buttonClassName="bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            <span data-testid="button-upload-profile-image">Upload Image</span>
                          </ObjectUploader>
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        disabled={updateCreatorMutation.isPending}
                        className="gradient-bg hover:opacity-90 transition-opacity"
                        data-testid="button-save-basic-info"
                      >
                        {updateCreatorMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Monetization Settings */}
                <Card className="bg-card border-border" data-testid="section-monetization">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Subscription Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="subscriptionPrice" className="text-sm font-medium mb-2 block">
                          Monthly Subscription Price
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            id="subscriptionPrice"
                            type="number"
                            step="0.01"
                            value={formData.subscriptionPrice}
                            onChange={(e) => setFormData(prev => ({ ...prev, subscriptionPrice: e.target.value }))}
                            className="pl-8 bg-input border-border"
                            data-testid="input-subscription-price"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">Free Trial</Label>
                          <p className="text-xs text-muted-foreground">Offer new subscribers a free trial</p>
                        </div>
                        <Switch
                          checked={freeTrialEnabled}
                          onCheckedChange={setFreeTrialEnabled}
                          data-testid="switch-free-trial"
                        />
                      </div>
                      {freeTrialEnabled && (
                        <div>
                          <Label htmlFor="freeTrialDays" className="text-sm font-medium mb-2 block">
                            Trial Duration (days)
                          </Label>
                          <Input
                            id="freeTrialDays"
                            type="number"
                            value={formData.freeTrialDays}
                            onChange={(e) => setFormData(prev => ({ ...prev, freeTrialDays: parseInt(e.target.value) || 0 }))}
                            className="bg-input border-border"
                            data-testid="input-trial-days"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Social Verification */}
                <Card className="bg-card border-border" data-testid="section-social-verification">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Social Verification</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                            <Instagram className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Instagram</p>
                            <p className="text-xs text-muted-foreground">Not connected</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-primary text-primary hover:bg-primary/10"
                          data-testid="button-connect-instagram"
                        >
                          Connect
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Twitter className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Twitter/X</p>
                            <p className="text-xs text-muted-foreground">Not connected</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-primary text-primary hover:bg-primary/10"
                          data-testid="button-connect-twitter"
                        >
                          Connect
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Profile Preview & Link in Bio */}
              <div className="space-y-6">
                {/* Profile Preview Card */}
                <Card className="bg-card border-border overflow-hidden" data-testid="section-profile-preview">
                  <div className="h-32 gradient-bg"></div>
                  <CardContent className="p-6 -mt-12 relative">
                    <img 
                      src={formData.profileImageUrl || user?.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
                      alt="Profile preview" 
                      className="w-20 h-20 rounded-full border-4 border-card mb-4 object-cover"
                      data-testid="img-profile-preview"
                    />
                    <h3 className="text-lg font-bold" data-testid="text-preview-name">
                      {formData.displayName || user?.firstName || "Your Name"}
                    </h3>
                    <p className="text-sm text-muted-foreground" data-testid="text-preview-username">
                      @{formData.username || "username"}
                    </p>
                    <p className="text-sm mt-2" data-testid="text-preview-bio">
                      {formData.bio || "Your bio will appear here..."}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                      <div>
                        <p className="text-lg font-bold" data-testid="text-preview-subscribers">
                          {subscriberCount}
                        </p>
                        <p className="text-xs text-muted-foreground">Subscribers</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold" data-testid="text-preview-posts">
                          {postCount}
                        </p>
                        <p className="text-xs text-muted-foreground">Posts</p>
                      </div>
                    </div>

                    <Button 
                      className="w-full gradient-bg text-white py-3 rounded-lg font-medium mt-4 hover:opacity-90 transition-opacity"
                      data-testid="button-preview-subscribe"
                    >
                      Subscribe - ${formData.subscriptionPrice || "0.00"}/month
                    </Button>
                  </CardContent>
                </Card>

                {/* Link in Bio */}
                <Card className="bg-card border-border" data-testid="section-link-in-bio">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Link in Bio</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-muted-foreground mb-1 block">Your FANZClub Link</Label>
                        <div className="flex">
                          <Input
                            value={`fanz.app/${formData.username || 'username'}`}
                            readOnly
                            className="flex-1 bg-input border-border rounded-r-none text-sm"
                            data-testid="input-fanz-link"
                          />
                          <Button 
                            onClick={handleCopyLink}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-l-none hover:bg-primary/90 transition-colors"
                            data-testid="button-copy-link"
                          >
                            {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <Button 
                        variant="ghost"
                        className="w-full text-center text-primary hover:text-primary/80 text-sm transition-colors"
                        data-testid="button-customize-link"
                      >
                        Customize Link in Bio Page
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
