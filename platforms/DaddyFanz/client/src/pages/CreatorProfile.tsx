import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MediaUpload from "@/components/media/MediaUpload";
import PaymentSettings from "@/components/payments/PaymentSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Settings, DollarSign, Upload, Edit } from "lucide-react";

export default function CreatorProfile() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: "",
    bio: "",
    subscriptionPrice: "",
  });

  // Redirect if not authenticated
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

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/profile"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: mediaAssets, isLoading: mediaLoading } = useQuery({
    queryKey: ["/api/media"],
    retry: false,
    enabled: isAuthenticated,
  });

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setProfileData({
        displayName: profile.displayName || "",
        bio: profile.bio || "",
        subscriptionPrice: profile.subscriptionPrice || "",
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      const response = await apiRequest("PUT", "/api/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
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
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-df-dungeon flex items-center justify-center">
        <div className="text-df-cyan text-xl font-display">Loading profile...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const isCreator = user.role === "creator" || user.role === "admin";

  if (!isCreator) {
    return (
      <div className="min-h-screen bg-df-dungeon">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="card-df max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-display text-df-cyan mb-4">Creator Access Required</h2>
              <p className="text-df-fog mb-4">
                You need to be a creator to access this page.
              </p>
              <Button 
                onClick={() => window.location.href = "/"}
                className="btn-primary"
                data-testid="button-back-home"
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-df-dungeon">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-df-snow mb-2">
            Creator Profile
          </h1>
          <p className="text-df-fog">Manage your creator profile and content</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="bg-df-brick border border-df-steel">
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-df-cyan data-[state=active]:text-df-ink text-df-fog"
              data-testid="tab-profile"
            >
              <Edit className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="content" 
              className="data-[state=active]:bg-df-cyan data-[state=active]:text-df-ink text-df-fog"
              data-testid="tab-content"
            >
              <Upload className="mr-2 h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger 
              value="payments" 
              className="data-[state=active]:bg-df-cyan data-[state=active]:text-df-ink text-df-fog"
              data-testid="tab-payments"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="data-[state=active]:bg-df-cyan data-[state=active]:text-df-ink text-df-fog"
              data-testid="tab-settings"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Info */}
              <Card className="card-df">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl neon-subheading">
                      Profile Information
                    </CardTitle>
                    <Button
                      onClick={() => setIsEditing(!isEditing)}
                      className="btn-outline"
                      data-testid="button-toggle-edit"
                    >
                      {isEditing ? "Cancel" : "Edit"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Avatar */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 bg-df-ink border-4 border-df-cyan rounded-full flex items-center justify-center shadow-glow mb-4">
                      <span className="text-df-cyan text-2xl font-bold">
                        {(profileData.displayName || user.email || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                    <Button className="btn-outline" data-testid="button-change-avatar">
                      <Camera className="mr-2 h-4 w-4" />
                      Change Photo
                    </Button>
                  </div>

                  {/* Profile Form */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="displayName" className="text-df-fog">Display Name</Label>
                      <Input
                        id="displayName"
                        type="text"
                        value={profileData.displayName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                        className="input-df"
                        disabled={!isEditing}
                        data-testid="input-display-name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="bio" className="text-df-fog">Bio</Label>
                      <Textarea
                        id="bio"
                        rows={4}
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        className="input-df resize-none"
                        placeholder="Tell your fans about yourself..."
                        disabled={!isEditing}
                        data-testid="textarea-bio"
                      />
                    </div>

                    <div>
                      <Label htmlFor="subscriptionPrice" className="text-df-fog">Subscription Price ($)</Label>
                      <Input
                        id="subscriptionPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={profileData.subscriptionPrice}
                        onChange={(e) => setProfileData(prev => ({ ...prev, subscriptionPrice: e.target.value }))}
                        className="input-df"
                        disabled={!isEditing}
                        data-testid="input-subscription-price"
                      />
                    </div>

                    {isEditing && (
                      <Button
                        onClick={handleSaveProfile}
                        disabled={updateProfileMutation.isPending}
                        className="w-full btn-primary"
                        data-testid="button-save-profile"
                      >
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Verification Status */}
              <Card className="card-df lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-xl neon-subheading">
                    Verification & Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Age Verification */}
                    <div className="bg-df-ink border border-df-steel rounded-md p-4">
                      <h4 className="text-df-cyan font-semibold mb-3">Age Verification</h4>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-df-fog text-sm">Status</span>
                        <span className="flex items-center text-green-400 text-sm" data-testid="status-age-verified">
                          {profile?.ageVerified ? (
                            <>
                              <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                              Verified
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                              Pending
                            </>
                          )}
                        </span>
                      </div>
                      {!profile?.ageVerified && (
                        <Button className="w-full btn-primary mt-3" data-testid="button-verify-age">
                          Verify Age
                        </Button>
                      )}
                    </div>

                    {/* KYC Status */}
                    <div className="bg-df-ink border border-df-steel rounded-md p-4">
                      <h4 className="text-df-cyan font-semibold mb-3">KYC Compliance</h4>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-df-fog text-sm">Status</span>
                        <span className="flex items-center text-green-400 text-sm" data-testid="status-kyc-status">
                          {profile?.kycStatus === 'verified' ? (
                            <>
                              <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                              Complete
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                              {profile?.kycStatus || 'Pending'}
                            </>
                          )}
                        </span>
                      </div>
                      {profile?.kycStatus !== 'verified' && (
                        <Button className="w-full btn-primary mt-3" data-testid="button-complete-kyc">
                          Complete KYC
                        </Button>
                      )}
                    </div>

                    {/* 2257 Records */}
                    <div className="bg-df-ink border border-df-steel rounded-md p-4">
                      <h4 className="text-df-cyan font-semibold mb-3">2257 Records</h4>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-df-fog text-sm">Compliance</span>
                        <span className="flex items-center text-green-400 text-sm" data-testid="status-2257-records">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                          Filed
                        </span>
                      </div>
                      <p className="text-df-fog text-xs">18 U.S.C. §2257 compliance maintained</p>
                    </div>

                    {/* Account Security */}
                    <div className="bg-df-ink border border-df-steel rounded-md p-4">
                      <h4 className="text-df-cyan font-semibold mb-3">Account Security</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-df-fog text-sm">Two-Factor Auth</span>
                          <span className="text-yellow-500 text-sm" data-testid="status-2fa">Disabled</span>
                        </div>
                        <Button className="w-full btn-outline" data-testid="button-enable-2fa">
                          Enable 2FA
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <MediaUpload />
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <PaymentSettings />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="card-df">
              <CardHeader>
                <CardTitle className="text-xl neon-subheading">
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Notification Preferences */}
                  <div>
                    <h4 className="text-df-snow font-semibold mb-4">Notification Preferences</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-df-fog">New Messages</span>
                        <button className="w-12 h-6 bg-df-cyan rounded-full relative">
                          <span className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></span>
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-df-fog">New Subscribers</span>
                        <button className="w-12 h-6 bg-df-cyan rounded-full relative">
                          <span className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></span>
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-df-fog">Payment Updates</span>
                        <button className="w-12 h-6 bg-df-cyan rounded-full relative">
                          <span className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Settings */}
                  <div className="border-t border-df-steel pt-6">
                    <h4 className="text-df-snow font-semibold mb-4">Privacy Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-df-fog">Profile Visibility</span>
                        <select className="bg-df-ink border border-df-steel rounded-md px-3 py-1 text-df-snow">
                          <option>Public</option>
                          <option>Subscribers Only</option>
                          <option>Private</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-df-fog">Allow Direct Messages</span>
                        <button className="w-12 h-6 bg-df-cyan rounded-full relative">
                          <span className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="border-t border-df-steel pt-6">
                    <h4 className="text-red-400 font-semibold mb-4">Danger Zone</h4>
                    <div className="space-y-3">
                      <Button className="w-full bg-red-600 hover:bg-red-700 text-white" data-testid="button-deactivate">
                        Deactivate Account
                      </Button>
                      <Button className="w-full bg-red-800 hover:bg-red-900 text-white" data-testid="button-delete">
                        Delete Account Permanently
                      </Button>
                    </div>
                    <p className="text-df-fog text-xs mt-2">
                      These actions cannot be undone. Please be certain.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
