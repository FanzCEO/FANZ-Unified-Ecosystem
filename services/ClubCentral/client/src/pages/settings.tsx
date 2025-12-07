import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Settings as SettingsIcon, User, Shield, CreditCard, Bell, Palette, Eye, EyeOff } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface UserSettings {
  notifications: {
    newSubscriber: boolean;
    newMessage: boolean;
    newTip: boolean;
    paymentReceived: boolean;
    emailNotifications: boolean;
  };
  privacy: {
    profileVisible: boolean;
    showOnlineStatus: boolean;
    allowDirectMessages: string;
  };
  payment: {
    processor: string;
    defaultPrice: string;
    currency: string;
  };
  preferences: {
    theme: string;
    language: string;
    timezone: string;
  };
}

export default function Settings() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      newSubscriber: true,
      newMessage: true,
      newTip: true,
      paymentReceived: true,
      emailNotifications: true,
    },
    privacy: {
      profileVisible: true,
      showOnlineStatus: true,
      allowDirectMessages: "subscribers",
    },
    payment: {
      processor: "ccbill",
      defaultPrice: "9.99",
      currency: "USD",
    },
    preferences: {
      theme: "dark",
      language: "en",
      timezone: "UTC",
    },
  });

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

  const { data: creatorProfile } = useQuery({
    queryKey: ["/api/creator/profile"],
    retry: false,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: UserSettings) => {
      await apiRequest("/api/settings", "PUT", newSettings);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(settings);
  };

  const updateSetting = (category: keyof UserSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
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
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Settings</h1>
              <p className="text-sm text-muted-foreground" data-testid="text-page-description">
                Manage your account preferences and configuration
              </p>
            </div>
            <Button 
              onClick={handleSaveSettings}
              disabled={updateSettingsMutation.isPending}
              className="gradient-bg hover:opacity-90 transition-opacity"
              data-testid="button-save-settings"
            >
              {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </header>

        <main className="p-4 lg:p-6 space-y-6">
          {/* Account Information */}
          <Card className="bg-card border-border" data-testid="section-account-info">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={(user as any)?.firstName || ""}
                    disabled
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={(user as any)?.lastName || ""}
                    disabled
                    data-testid="input-last-name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={(user as any)?.email || ""}
                  disabled
                  data-testid="input-email"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Contact support to update your email address
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-card border-border" data-testid="section-notifications">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>New Subscriber</Label>
                  <p className="text-sm text-muted-foreground">Get notified when someone subscribes</p>
                </div>
                <Switch
                  checked={settings.notifications.newSubscriber}
                  onCheckedChange={(checked) => updateSetting('notifications', 'newSubscriber', checked)}
                  data-testid="switch-new-subscriber"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>New Messages</Label>
                  <p className="text-sm text-muted-foreground">Get notified of new direct messages</p>
                </div>
                <Switch
                  checked={settings.notifications.newMessage}
                  onCheckedChange={(checked) => updateSetting('notifications', 'newMessage', checked)}
                  data-testid="switch-new-message"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Tips Received</Label>
                  <p className="text-sm text-muted-foreground">Get notified when you receive tips</p>
                </div>
                <Switch
                  checked={settings.notifications.newTip}
                  onCheckedChange={(checked) => updateSetting('notifications', 'newTip', checked)}
                  data-testid="switch-new-tip"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Payment Received</Label>
                  <p className="text-sm text-muted-foreground">Get notified of successful payments</p>
                </div>
                <Switch
                  checked={settings.notifications.paymentReceived}
                  onCheckedChange={(checked) => updateSetting('notifications', 'paymentReceived', checked)}
                  data-testid="switch-payment-received"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={(checked) => updateSetting('notifications', 'emailNotifications', checked)}
                  data-testid="switch-email-notifications"
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card className="bg-card border-border" data-testid="section-privacy">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Privacy & Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground">Make your profile visible to the public</p>
                </div>
                <Switch
                  checked={settings.privacy.profileVisible}
                  onCheckedChange={(checked) => updateSetting('privacy', 'profileVisible', checked)}
                  data-testid="switch-profile-visible"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Online Status</Label>
                  <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                </div>
                <Switch
                  checked={settings.privacy.showOnlineStatus}
                  onCheckedChange={(checked) => updateSetting('privacy', 'showOnlineStatus', checked)}
                  data-testid="switch-online-status"
                />
              </div>
              <Separator />
              <div>
                <Label>Direct Messages</Label>
                <p className="text-sm text-muted-foreground mb-2">Who can send you direct messages</p>
                <Select
                  value={settings.privacy.allowDirectMessages}
                  onValueChange={(value) => updateSetting('privacy', 'allowDirectMessages', value)}
                >
                  <SelectTrigger data-testid="select-direct-messages">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="subscribers">Subscribers Only</SelectItem>
                    <SelectItem value="none">No One</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payment Settings */}
          <Card className="bg-card border-border" data-testid="section-payment">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Payment Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Payment Processor</Label>
                <p className="text-sm text-muted-foreground mb-2">Choose your preferred payment processor</p>
                <Select
                  value={settings.payment.processor}
                  onValueChange={(value) => updateSetting('payment', 'processor', value)}
                >
                  <SelectTrigger data-testid="select-payment-processor">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ccbill">CCBill</SelectItem>
                    <SelectItem value="paxum">Paxum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="defaultPrice">Default Subscription Price</Label>
                  <Input
                    id="defaultPrice"
                    type="number"
                    step="0.01"
                    value={settings.payment.defaultPrice}
                    onChange={(e) => updateSetting('payment', 'defaultPrice', e.target.value)}
                    data-testid="input-default-price"
                  />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select
                    value={settings.payment.currency}
                    onValueChange={(value) => updateSetting('payment', 'currency', value)}
                  >
                    <SelectTrigger data-testid="select-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance & Preferences */}
          <Card className="bg-card border-border" data-testid="section-preferences">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Appearance & Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Theme</Label>
                  <Select
                    value={settings.preferences.theme}
                    onValueChange={(value) => updateSetting('preferences', 'theme', value)}
                  >
                    <SelectTrigger data-testid="select-theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Language</Label>
                  <Select
                    value={settings.preferences.language}
                    onValueChange={(value) => updateSetting('preferences', 'language', value)}
                  >
                    <SelectTrigger data-testid="select-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Timezone</Label>
                  <Select
                    value={settings.preferences.timezone}
                    onValueChange={(value) => updateSetting('preferences', 'timezone', value)}
                  >
                    <SelectTrigger data-testid="select-timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-card border-border border-destructive/50" data-testid="section-danger-zone">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg">
                <div>
                  <h3 className="font-medium text-destructive">Delete Account</h3>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  data-testid="button-delete-account"
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}