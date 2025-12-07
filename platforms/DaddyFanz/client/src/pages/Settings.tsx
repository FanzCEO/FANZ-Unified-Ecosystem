import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  Lock, 
  Eye, 
  Trash2, 
  Download,
  AlertTriangle,
  Key,
  Smartphone
} from "lucide-react";

export default function Settings() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [notificationSettings, setNotificationSettings] = useState({
    newMessages: true,
    newSubscribers: true,
    paymentUpdates: true,
    contentApproved: true,
    contentRejected: true,
    payoutProcessed: true,
    emailEnabled: true,
    pushEnabled: true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    allowDirectMessages: true,
    showOnlineStatus: true,
    allowSearchIndexing: false,
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginNotifications: true,
    sessionTimeout: 7, // days
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

  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
    retry: false,
    enabled: isAuthenticated,
  });

  // Update notification settings mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (settings: typeof notificationSettings) => {
      // This would call an API endpoint to update notification preferences
      const response = await apiRequest("PUT", "/api/notifications/preferences", settings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved.",
      });
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
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExportData = () => {
    toast({
      title: "Data Export Requested",
      description: "You'll receive an email with your data within 24 hours.",
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Account Deletion",
      description: "Please contact support to delete your account.",
      variant: "destructive",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-df-dungeon flex items-center justify-center">
        <div className="text-df-cyan text-xl font-display">Loading settings...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-df-dungeon">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-df-snow mb-2">
            Settings
          </h1>
          <p className="text-df-fog">Manage your account preferences and security</p>
        </div>

        <Tabs defaultValue="notifications" className="space-y-8">
          <TabsList className="bg-df-brick border border-df-steel">
            <TabsTrigger 
              value="notifications" 
              className="data-[state=active]:bg-df-cyan data-[state=active]:text-df-ink text-df-fog"
              data-testid="tab-notifications"
            >
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="privacy" 
              className="data-[state=active]:bg-df-cyan data-[state=active]:text-df-ink text-df-fog"
              data-testid="tab-privacy"
            >
              <Eye className="mr-2 h-4 w-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="data-[state=active]:bg-df-cyan data-[state=active]:text-df-ink text-df-fog"
              data-testid="tab-security"
            >
              <Shield className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger 
              value="data" 
              className="data-[state=active]:bg-df-cyan data-[state=active]:text-df-ink text-df-fog"
              data-testid="tab-data"
            >
              <Download className="mr-2 h-4 w-4" />
              Data & Privacy
            </TabsTrigger>
            <TabsTrigger 
              value="account" 
              className="data-[state=active]:bg-df-cyan data-[state=active]:text-df-ink text-df-fog"
              data-testid="tab-account"
            >
              <SettingsIcon className="mr-2 h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="card-df">
              <CardHeader>
                <CardTitle className="text-xl neon-subheading">
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Notification Types */}
                <div>
                  <h4 className="text-df-snow font-semibold mb-4">Activity Notifications</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-df-fog">New Messages</Label>
                        <p className="text-df-fog text-sm">Get notified when you receive new messages</p>
                      </div>
                      <Switch
                        checked={notificationSettings.newMessages}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, newMessages: checked }))
                        }
                        data-testid="switch-new-messages"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-df-fog">New Subscribers</Label>
                        <p className="text-df-fog text-sm">Get notified when someone subscribes to you</p>
                      </div>
                      <Switch
                        checked={notificationSettings.newSubscribers}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, newSubscribers: checked }))
                        }
                        data-testid="switch-new-subscribers"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-df-fog">Payment Updates</Label>
                        <p className="text-df-fog text-sm">Get notified about payments and payouts</p>
                      </div>
                      <Switch
                        checked={notificationSettings.paymentUpdates}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, paymentUpdates: checked }))
                        }
                        data-testid="switch-payment-updates"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-df-fog">Content Approved</Label>
                        <p className="text-df-fog text-sm">Get notified when your content is approved</p>
                      </div>
                      <Switch
                        checked={notificationSettings.contentApproved}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, contentApproved: checked }))
                        }
                        data-testid="switch-content-approved"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Methods */}
                <div className="border-t border-df-steel pt-6">
                  <h4 className="text-df-snow font-semibold mb-4">Delivery Methods</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-df-fog">Email Notifications</Label>
                        <p className="text-df-fog text-sm">Receive notifications via email</p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailEnabled}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, emailEnabled: checked }))
                        }
                        data-testid="switch-email-enabled"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-df-fog">Push Notifications</Label>
                        <p className="text-df-fog text-sm">Receive push notifications on your devices</p>
                      </div>
                      <Switch
                        checked={notificationSettings.pushEnabled}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, pushEnabled: checked }))
                        }
                        data-testid="switch-push-enabled"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => updateNotificationsMutation.mutate(notificationSettings)}
                  disabled={updateNotificationsMutation.isPending}
                  className="w-full btn-primary"
                  data-testid="button-save-notifications"
                >
                  {updateNotificationsMutation.isPending ? "Saving..." : "Save Notification Preferences"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <Card className="card-df">
              <CardHeader>
                <CardTitle className="text-xl neon-subheading">
                  Privacy Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="profileVisibility" className="text-df-fog">Profile Visibility</Label>
                  <p className="text-df-fog text-sm mb-2">Control who can see your profile</p>
                  <select 
                    id="profileVisibility"
                    value={privacySettings.profileVisibility}
                    onChange={(e) => setPrivacySettings(prev => ({ ...prev, profileVisibility: e.target.value }))}
                    className="w-full bg-df-ink border border-df-steel rounded-md px-3 py-2 text-df-snow"
                    data-testid="select-profile-visibility"
                  >
                    <option value="public">Public</option>
                    <option value="subscribers">Subscribers Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-df-fog">Allow Direct Messages</Label>
                    <p className="text-df-fog text-sm">Let people send you messages</p>
                  </div>
                  <Switch
                    checked={privacySettings.allowDirectMessages}
                    onCheckedChange={(checked) => 
                      setPrivacySettings(prev => ({ ...prev, allowDirectMessages: checked }))
                    }
                    data-testid="switch-allow-messages"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-df-fog">Show Online Status</Label>
                    <p className="text-df-fog text-sm">Let others see when you're online</p>
                  </div>
                  <Switch
                    checked={privacySettings.showOnlineStatus}
                    onCheckedChange={(checked) => 
                      setPrivacySettings(prev => ({ ...prev, showOnlineStatus: checked }))
                    }
                    data-testid="switch-online-status"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-df-fog">Search Engine Indexing</Label>
                    <p className="text-df-fog text-sm">Allow search engines to index your public content</p>
                  </div>
                  <Switch
                    checked={privacySettings.allowSearchIndexing}
                    onCheckedChange={(checked) => 
                      setPrivacySettings(prev => ({ ...prev, allowSearchIndexing: checked }))
                    }
                    data-testid="switch-search-indexing"
                  />
                </div>

                <Button className="w-full btn-primary" data-testid="button-save-privacy">
                  Save Privacy Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="card-df">
              <CardHeader>
                <CardTitle className="text-xl neon-subheading">
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Two-Factor Authentication */}
                <div className="bg-df-ink border border-df-steel rounded-md p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-df-cyan" />
                      <div>
                        <h4 className="text-df-snow font-semibold">Two-Factor Authentication</h4>
                        <p className="text-df-fog text-sm">Add an extra layer of security to your account</p>
                      </div>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorEnabled}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: checked }))
                      }
                      data-testid="switch-2fa"
                    />
                  </div>
                  {!securitySettings.twoFactorEnabled && (
                    <Button className="w-full btn-outline" data-testid="button-setup-2fa">
                      <Key className="mr-2 h-4 w-4" />
                      Setup Two-Factor Authentication
                    </Button>
                  )}
                </div>

                {/* Login Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-df-fog">Login Notifications</Label>
                    <p className="text-df-fog text-sm">Get notified when someone logs into your account</p>
                  </div>
                  <Switch
                    checked={securitySettings.loginNotifications}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({ ...prev, loginNotifications: checked }))
                    }
                    data-testid="switch-login-notifications"
                  />
                </div>

                {/* Session Timeout */}
                <div>
                  <Label htmlFor="sessionTimeout" className="text-df-fog">Session Timeout</Label>
                  <p className="text-df-fog text-sm mb-2">Automatically log out after inactivity</p>
                  <select 
                    id="sessionTimeout"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                    className="w-full bg-df-ink border border-df-steel rounded-md px-3 py-2 text-df-snow"
                    data-testid="select-session-timeout"
                  >
                    <option value={1}>1 day</option>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                  </select>
                </div>

                {/* Change Password */}
                <div className="border-t border-df-steel pt-6">
                  <h4 className="text-df-snow font-semibold mb-4">Change Password</h4>
                  <div className="space-y-3">
                    <Input
                      type="password"
                      placeholder="Current password"
                      className="input-df"
                      data-testid="input-current-password"
                    />
                    <Input
                      type="password"
                      placeholder="New password"
                      className="input-df"
                      data-testid="input-new-password"
                    />
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      className="input-df"
                      data-testid="input-confirm-password"
                    />
                    <Button className="w-full btn-primary" data-testid="button-change-password">
                      Update Password
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data & Privacy Tab */}
          <TabsContent value="data">
            <Card className="card-df">
              <CardHeader>
                <CardTitle className="text-xl neon-subheading">
                  Data & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Data Export */}
                <div className="bg-df-ink border border-df-steel rounded-md p-4">
                  <h4 className="text-df-snow font-semibold mb-2">Export Your Data</h4>
                  <p className="text-df-fog text-sm mb-4">
                    Download a copy of all your data including messages, content, and account information.
                  </p>
                  <Button 
                    onClick={handleExportData}
                    className="btn-outline"
                    data-testid="button-export-data"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Request Data Export
                  </Button>
                </div>

                {/* GDPR Rights */}
                <div className="bg-df-ink border border-df-steel rounded-md p-4">
                  <h4 className="text-df-snow font-semibold mb-2">Your Privacy Rights</h4>
                  <div className="space-y-2 text-df-fog text-sm">
                    <p>• Right to access your personal data</p>
                    <p>• Right to rectify inaccurate data</p>
                    <p>• Right to erase your data (right to be forgotten)</p>
                    <p>• Right to restrict processing</p>
                    <p>• Right to data portability</p>
                    <p>• Right to object to processing</p>
                  </div>
                </div>

                {/* Data Retention */}
                <div className="bg-df-ink border border-df-steel rounded-md p-4">
                  <h4 className="text-df-snow font-semibold mb-2">Data Retention</h4>
                  <div className="space-y-2 text-df-fog text-sm">
                    <p>• Account data: Retained until account deletion</p>
                    <p>• Financial records: 7 years (legal requirement)</p>
                    <p>• Content: 2 years after deletion</p>
                    <p>• Messages: 1 year after deletion</p>
                    <p>• Compliance records: Permanently retained</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <Card className="card-df">
              <CardHeader>
                <CardTitle className="text-xl neon-subheading">
                  Account Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Account Info */}
                <div className="bg-df-ink border border-df-steel rounded-md p-4">
                  <h4 className="text-df-snow font-semibold mb-3">Account Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-df-fog text-sm">User ID</Label>
                      <p className="text-df-snow font-mono text-sm" data-testid="text-user-id">{user.id}</p>
                    </div>
                    <div>
                      <Label className="text-df-fog text-sm">Email</Label>
                      <p className="text-df-snow text-sm" data-testid="text-email">{user.email}</p>
                    </div>
                    <div>
                      <Label className="text-df-fog text-sm">Role</Label>
                      <p className="text-df-snow text-sm capitalize" data-testid="text-role">{user.role}</p>
                    </div>
                    <div>
                      <Label className="text-df-fog text-sm">Account Status</Label>
                      <p className="text-df-snow text-sm capitalize" data-testid="text-status">{user.status}</p>
                    </div>
                  </div>
                </div>

                {/* Deactivate Account */}
                <div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-md p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-yellow-200 font-semibold mb-2">Deactivate Account</h4>
                      <p className="text-yellow-100 text-sm mb-4">
                        Temporarily disable your account. You can reactivate it later by logging in.
                      </p>
                      <Button className="bg-yellow-600 hover:bg-yellow-700 text-black" data-testid="button-deactivate">
                        Deactivate Account
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Delete Account */}
                <div className="bg-red-900 bg-opacity-20 border border-red-600 rounded-md p-4">
                  <div className="flex items-start gap-3">
                    <Trash2 className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-red-200 font-semibold mb-2">Delete Account Permanently</h4>
                      <p className="text-red-100 text-sm mb-4">
                        This action cannot be undone. All your data, content, and messages will be permanently deleted.
                        Financial records will be retained for legal compliance.
                      </p>
                      <Button 
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        data-testid="button-delete-account"
                      >
                        Delete Account Permanently
                      </Button>
                    </div>
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
