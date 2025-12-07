import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/layout/Sidebar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Shield, 
  Bell, 
  Lock, 
  Globe, 
  Eye, 
  CreditCard,
  Trash2,
  AlertTriangle
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState({
    notifications: {
      newMessages: true,
      newFollowers: true,
      tips: true,
      marketing: false,
    },
    privacy: {
      showOnlineStatus: true,
      allowDirectMessages: true,
      profileVisible: true,
    },
    security: {
      twoFactorEnabled: false,
      loginNotifications: true,
    },
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/settings", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Settings updated successfully!",
      });
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
        description: "Failed to update settings.",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/auth/password", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password changed successfully!",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
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
        description: "Failed to change password.",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/auth/account", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      window.location.href = "/";
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
        description: "Failed to delete account.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(settings);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      deleteAccountMutation.mutate();
    }
  };

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
            <Tabs defaultValue="notifications" className="space-y-8">
              <TabsList className="grid w-full grid-cols-4 bg-gf-graphite">
                <TabsTrigger value="notifications" className="data-[state=active]:bg-gf-pink">
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="privacy" className="data-[state=active]:bg-gf-pink">
                  Privacy
                </TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-gf-pink">
                  Security
                </TabsTrigger>
                <TabsTrigger value="account" className="data-[state=active]:bg-gf-pink">
                  Account
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notifications" className="space-y-6">
                <Card className="glass-overlay border-gf-smoke/20">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gf-snow">
                      <Bell className="h-6 w-6 mr-2 text-gf-cyan" />
                      Notification Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {Object.entries(settings.notifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <Label className="text-gf-snow capitalize">
                              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </Label>
                            <p className="text-sm text-gf-smoke">
                              {key === 'newMessages' && 'Get notified when you receive new messages'}
                              {key === 'newFollowers' && 'Get notified when someone follows you'}
                              {key === 'tips' && 'Get notified when you receive tips'}
                              {key === 'marketing' && 'Receive marketing emails and updates'}
                            </p>
                          </div>
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                notifications: {
                                  ...settings.notifications,
                                  [key]: checked,
                                },
                              })
                            }
                            data-testid={`switch-${key}`}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="privacy" className="space-y-6">
                <Card className="glass-overlay border-gf-smoke/20">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gf-snow">
                      <Eye className="h-6 w-6 mr-2 text-gf-violet" />
                      Privacy Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {Object.entries(settings.privacy).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <Label className="text-gf-snow capitalize">
                              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </Label>
                            <p className="text-sm text-gf-smoke">
                              {key === 'showOnlineStatus' && 'Show when you are online to other users'}
                              {key === 'allowDirectMessages' && 'Allow fans to send you direct messages'}
                              {key === 'profileVisible' && 'Make your profile visible in search results'}
                            </p>
                          </div>
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                privacy: {
                                  ...settings.privacy,
                                  [key]: checked,
                                },
                              })
                            }
                            data-testid={`switch-privacy-${key}`}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card className="glass-overlay border-gf-smoke/20">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gf-snow">
                      <Shield className="h-6 w-6 mr-2 text-success" />
                      Security Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {Object.entries(settings.security).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <Label className="text-gf-snow capitalize">
                              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </Label>
                            <p className="text-sm text-gf-smoke">
                              {key === 'twoFactorEnabled' && 'Add an extra layer of security to your account'}
                              {key === 'loginNotifications' && 'Get notified when someone logs into your account'}
                            </p>
                          </div>
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                security: {
                                  ...settings.security,
                                  [key]: checked,
                                },
                              })
                            }
                            data-testid={`switch-security-${key}`}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Change Password Section */}
                    <div className="border-t border-gf-smoke/20 pt-6">
                      <h3 className="font-semibold text-gf-snow mb-4 flex items-center">
                        <Lock className="h-5 w-5 mr-2" />
                        Change Password
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="currentPassword" className="text-gf-smoke">Current Password</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="bg-gf-graphite border-gf-smoke/20 text-gf-snow focus:border-gf-pink"
                            data-testid="input-current-password"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newPassword" className="text-gf-smoke">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="bg-gf-graphite border-gf-smoke/20 text-gf-snow focus:border-gf-pink"
                            data-testid="input-new-password"
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword" className="text-gf-smoke">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="bg-gf-graphite border-gf-smoke/20 text-gf-snow focus:border-gf-pink"
                            data-testid="input-confirm-password"
                          />
                        </div>
                        <Button
                          onClick={handleChangePassword}
                          disabled={changePasswordMutation.isPending}
                          className="bg-gf-violet text-gf-snow hover:bg-gf-violet/80"
                          data-testid="button-change-password"
                        >
                          {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="account" className="space-y-6">
                <Card className="glass-overlay border-gf-smoke/20">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gf-snow">
                      <Globe className="h-6 w-6 mr-2 text-gf-cyan" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-gf-smoke">Username</Label>
                        <Input
                          value={user?.username || ""}
                          disabled
                          className="bg-gf-graphite border-gf-smoke/20 text-gf-smoke"
                        />
                      </div>
                      <div>
                        <Label className="text-gf-smoke">Email</Label>
                        <Input
                          value={user?.email || ""}
                          disabled
                          className="bg-gf-graphite border-gf-smoke/20 text-gf-smoke"
                        />
                      </div>
                      <div>
                        <Label className="text-gf-smoke">Account Type</Label>
                        <Input
                          value={user?.role || ""}
                          disabled
                          className="bg-gf-graphite border-gf-smoke/20 text-gf-smoke capitalize"
                        />
                      </div>
                      <div>
                        <Label className="text-gf-smoke">Member Since</Label>
                        <Input
                          value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}
                          disabled
                          className="bg-gf-graphite border-gf-smoke/20 text-gf-smoke"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="glass-overlay border-error/20">
                  <CardHeader>
                    <CardTitle className="flex items-center text-error">
                      <AlertTriangle className="h-6 w-6 mr-2" />
                      Danger Zone
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-error/10 border border-error/20 rounded-lg p-6">
                      <h3 className="font-semibold text-error mb-2">Delete Account</h3>
                      <p className="text-gf-smoke text-sm mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                        All your content, earnings, and data will be permanently deleted.
                      </p>
                      <Button
                        onClick={handleDeleteAccount}
                        disabled={deleteAccountMutation.isPending}
                        variant="destructive"
                        className="bg-error text-gf-snow hover:bg-error/80"
                        data-testid="button-delete-account"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Save Settings Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
                className="bg-gf-gradient text-gf-snow hover:shadow-glow-pink"
                data-testid="button-save-settings"
              >
                {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
