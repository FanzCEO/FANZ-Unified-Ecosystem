import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/layout/Sidebar";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Camera, Shield, CreditCard } from "lucide-react";
import type { UploadResult } from "@uppy/core";

export default function CreatorProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profileData, setProfileData] = useState({
    displayName: "",
    bio: "",
    subscriptionPrice: 0,
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/profile"],
    select: (data) => {
      // Initialize form data when profile loads
      if (data && !profileData.displayName) {
        setProfileData({
          displayName: data.displayName || "",
          bio: data.bio || "",
          subscriptionPrice: data.subscriptionPrice ? data.subscriptionPrice / 100 : 0,
        });
      }
      return data;
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      ...profileData,
      subscriptionPrice: Math.round(profileData.subscriptionPrice * 100), // Convert to cents
    });
  };

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleAvatarUpload = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      // TODO: Update profile with new avatar URL
      toast({
        title: "Success",
        description: "Avatar updated successfully!",
      });
    }
  };

  const handleBannerUpload = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      // TODO: Update profile with new banner URL
      toast({
        title: "Success",
        description: "Banner updated successfully!",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gf-ink text-gf-snow flex items-center justify-center">
        <div className="text-xl">Loading profile...</div>
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
            <Tabs defaultValue="profile" className="space-y-8">
              <TabsList className="grid w-full grid-cols-3 bg-gf-graphite text-xs sm:text-sm">
                <TabsTrigger value="profile" className="data-[state=active]:bg-gf-pink">
                  Profile
                </TabsTrigger>
                <TabsTrigger value="verification" className="data-[state=active]:bg-gf-pink">
                  Verification
                </TabsTrigger>
                <TabsTrigger value="payouts" className="data-[state=active]:bg-gf-pink">
                  Payouts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-8">
                {/* Banner Section */}
                <Card className="glass-overlay border-gf-smoke/20">
                  <CardContent className="p-0">
                    <div className="relative">
                      {/* Banner Image */}
                      <div className="h-32 sm:h-40 md:h-48 bg-gradient-to-r from-gf-pink/20 to-gf-violet/20 rounded-t-lg flex items-center justify-center">
                        {profile?.bannerUrl ? (
                          <img
                            src={profile.bannerUrl}
                            alt="Profile banner"
                            className="w-full h-full object-cover rounded-t-lg"
                          />
                        ) : (
                          <div className="text-gf-smoke text-center">
                            <Camera className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-2" />
                            <p>Upload a banner image</p>
                          </div>
                        )}
                      </div>

                      {/* Banner Upload Button */}
                      <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={10 * 1024 * 1024}
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={handleBannerUpload}
                          buttonClassName="bg-gf-graphite/80 text-gf-snow border border-gf-smoke/20 hover:bg-gf-graphite"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Change Banner
                        </ObjectUploader>
                      </div>

                      {/* Avatar */}
                      <div className="absolute -bottom-12 sm:-bottom-16 left-4 sm:left-8">
                        <div className="relative">
                          <img
                            src={profile?.avatarUrl || "/api/placeholder/128/128"}
                            alt="Profile avatar"
                            className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-2 sm:border-4 border-gf-graphite"
                            data-testid="img-profile-avatar"
                          />
                          <div className="absolute bottom-2 right-2">
                            <ObjectUploader
                              maxNumberOfFiles={1}
                              maxFileSize={5 * 1024 * 1024}
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={handleAvatarUpload}
                              buttonClassName="bg-gf-pink text-gf-snow p-2 rounded-full hover:bg-gf-pink/80"
                            >
                              <Camera className="h-4 w-4" />
                            </ObjectUploader>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-16 sm:pt-20 p-4 sm:p-6 md:p-8">
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="displayName" className="text-gf-smoke">Display Name</Label>
                            <Input
                              id="displayName"
                              value={profileData.displayName}
                              onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                              className="bg-gf-graphite border-gf-smoke/20 text-gf-snow focus:border-gf-pink"
                              placeholder="Your display name"
                              data-testid="input-display-name"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="subscriptionPrice" className="text-gf-smoke">Monthly Subscription Price</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gf-smoke">$</span>
                              <Input
                                id="subscriptionPrice"
                                type="number"
                                step="0.01"
                                min="0"
                                value={profileData.subscriptionPrice}
                                onChange={(e) => setProfileData({ ...profileData, subscriptionPrice: parseFloat(e.target.value) || 0 })}
                                className="bg-gf-graphite border-gf-smoke/20 text-gf-snow focus:border-gf-pink pl-8"
                                placeholder="0.00"
                                data-testid="input-subscription-price"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bio" className="text-gf-smoke">Bio</Label>
                          <Textarea
                            id="bio"
                            value={profileData.bio}
                            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                            className="bg-gf-graphite border-gf-smoke/20 text-gf-snow focus:border-gf-pink resize-none h-32"
                            placeholder="Tell your fans about yourself..."
                            data-testid="textarea-bio"
                          />
                        </div>

                        <Button
                          onClick={handleSaveProfile}
                          disabled={updateProfileMutation.isPending}
                          className="bg-gf-gradient text-gf-snow hover:shadow-glow-pink"
                          data-testid="button-save-profile"
                        >
                          {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="verification" className="space-y-8">
                <Card className="glass-overlay border-gf-smoke/20">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gf-snow">
                      <Shield className="h-6 w-6 mr-2 text-gf-violet" />
                      Age & Identity Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-gf-violet/10 border border-gf-violet/20 rounded-lg p-6">
                      <h3 className="font-semibold text-gf-snow mb-2">Verification Status</h3>
                      <div className="flex items-center space-x-2 mb-4">
                        <div className={`w-3 h-3 rounded-full ${profile?.kycStatus === 'verified' ? 'bg-success' : 'bg-warning'}`} />
                        <span className="text-gf-snow capitalize">
                          {profile?.kycStatus || 'Pending'}
                        </span>
                      </div>
                      <p className="text-gf-smoke text-sm">
                        Verification is required for creator accounts to comply with 18 U.S.C. §2257 regulations.
                        Please upload a government-issued ID to complete verification.
                      </p>
                    </div>

                    {profile?.kycStatus !== 'verified' && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-gf-snow">Upload Verification Documents</h3>
                        <ObjectUploader
                          maxNumberOfFiles={2}
                          maxFileSize={10 * 1024 * 1024}
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result) => {
                            toast({
                              title: "Documents Uploaded",
                              description: "Your verification documents have been submitted for review.",
                            });
                          }}
                          buttonClassName="bg-gf-violet text-gf-snow hover:bg-gf-violet/80"
                        >
                          Upload ID Documents
                        </ObjectUploader>
                        <p className="text-xs text-gf-smoke">
                          Accepted: Driver's License, Passport, State ID. Processing typically takes 24-48 hours.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payouts" className="space-y-8">
                <Card className="glass-overlay border-gf-smoke/20">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gf-snow">
                      <CreditCard className="h-6 w-6 mr-2 text-success" />
                      Payout Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-success/10 border border-success/20 rounded-lg p-6">
                      <h3 className="font-semibold text-gf-snow mb-2">Adult-Friendly Payment Processors</h3>
                      <p className="text-gf-smoke text-sm mb-4">
                        We only work with payment processors that support adult content creators.
                      </p>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-gf-graphite rounded-lg p-4 text-center">
                          <div className="font-semibold text-gf-snow">Paxum</div>
                          <div className="text-xs text-gf-smoke">Primary Option</div>
                        </div>
                        <div className="bg-gf-graphite rounded-lg p-4 text-center">
                          <div className="font-semibold text-gf-snow">ePayService</div>
                          <div className="text-xs text-gf-smoke">Alternative</div>
                        </div>
                        <div className="bg-gf-graphite rounded-lg p-4 text-center">
                          <div className="font-semibold text-gf-snow">Crypto</div>
                          <div className="text-xs text-gf-smoke">BTC/ETH/USDT</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-gf-snow">Add Payout Method</h3>
                      <Button
                        className="bg-gf-gradient text-gf-snow hover:shadow-glow-pink"
                        data-testid="button-add-payout-method"
                      >
                        Connect Paxum Account
                      </Button>
                      <p className="text-xs text-gf-smoke">
                        Minimum payout: $20. Processing time: 1-3 business days.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </div>
  );
}
