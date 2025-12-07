import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Settings as SettingsIcon,
  User as UserIcon,
  Lock,
  Bell,
  CreditCard,
  Shield,
  Eye,
  Globe,
  Smartphone,
  Mail,
  Key,
  UserX,
  LogOut,
  Save,
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronRight,
  Moon,
  Sun,
  Languages,
  MapPin,
  Calendar,
  Link2,
  Twitter,
  Instagram,
  Youtube,
  Twitch,
  MessageCircle,
  Users,
  Heart,
  DollarSign,
  TrendingUp,
  Zap,
  Gift,
  Star,
  Ban,
  AlertTriangle,
  HelpCircle,
  FileText,
  Download,
  Trash2,
  RefreshCw,
  Volume2,
  VolumeX,
  Palette,
  Check,
  X,
  Plus
} from "lucide-react";
import { Link } from "wouter";

interface UserSettings {
  profile: {
    username: string;
    displayName: string;
    email: string;
    bio: string;
    location: string;
    website: string;
    birthDate: string;
    avatar: string;
    banner: string;
  };
  privacy: {
    profileVisibility: "public" | "subscribers" | "private";
    showOnlineStatus: boolean;
    allowMessages: "everyone" | "subscribers" | "no-one";
    showSubscriberCount: boolean;
    showEarnings: boolean;
    hideFromSearch: boolean;
    allowTagging: boolean;
    contentDefault: "public" | "subscribers" | "ppv";
  };
  notifications: {
    email: {
      newSubscriber: boolean;
      newMessage: boolean;
      newTip: boolean;
      newPurchase: boolean;
      contestUpdate: boolean;
      weeklyReport: boolean;
    };
    push: {
      newSubscriber: boolean;
      newMessage: boolean;
      newTip: boolean;
      newPurchase: boolean;
      liveStream: boolean;
    };
    sms: {
      enabled: boolean;
      phoneNumber?: string;
      importantOnly: boolean;
    };
  };
  payment: {
    payoutMethod: "bank" | "paypal" | "crypto";
    payoutSchedule: "daily" | "weekly" | "monthly";
    minPayout: number;
    taxId?: string;
    bankAccount?: {
      accountNumber: string;
      routingNumber: string;
      accountHolder: string;
    };
    paypalEmail?: string;
    cryptoWallet?: string;
  };
  security: {
    twoFactorEnabled: boolean;
    loginAlerts: boolean;
    trustedDevices: {
      id: string;
      name: string;
      lastUsed: string;
    }[];
    blockedUsers: string[];
    restrictedCountries: string[];
  };
  preferences: {
    theme: "light" | "dark" | "auto";
    language: string;
    timezone: string;
    currency: string;
    contentWarnings: boolean;
    autoplay: boolean;
    highQualityMedia: boolean;
    soundEnabled: boolean;
    colorScheme: "default" | "purple" | "pink" | "blue";
  };
  creator?: {
    subscriptionPrice: number;
    subscriptionBundles: {
      months: number;
      discount: number;
    }[];
    ppvMessagePrice: number;
    customRequestsEnabled: boolean;
    customRequestPrice: number;
    tipsEnabled: boolean;
    minTipAmount: number;
    watermarkContent: boolean;
    contentCategories: string[];
    ageRestriction: number;
  };
}

export default function Settings() {
  const { user } = useAuth() as { user: User | undefined };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("profile");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  // Fetch user settings
  const { data: settings, isLoading: settingsLoading } = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
    enabled: !!user,
  });

  // Mock data for demonstration
  const mockSettings: UserSettings = settings || {
    profile: {
      username: user?.username || "johndoe",
      displayName: "John Doe",
      email: user?.email || "john@example.com",
      bio: "Content creator and artist",
      location: "Los Angeles, CA",
      website: "johndoe.com",
      birthDate: "1990-01-15",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop&crop=face",
      banner: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=400&fit=crop"
    },
    privacy: {
      profileVisibility: "public",
      showOnlineStatus: true,
      allowMessages: "everyone",
      showSubscriberCount: true,
      showEarnings: false,
      hideFromSearch: false,
      allowTagging: true,
      contentDefault: "subscribers"
    },
    notifications: {
      email: {
        newSubscriber: true,
        newMessage: true,
        newTip: true,
        newPurchase: true,
        contestUpdate: false,
        weeklyReport: true
      },
      push: {
        newSubscriber: true,
        newMessage: true,
        newTip: true,
        newPurchase: true,
        liveStream: true
      },
      sms: {
        enabled: false,
        phoneNumber: "",
        importantOnly: true
      }
    },
    payment: {
      payoutMethod: "bank",
      payoutSchedule: "weekly",
      minPayout: 100,
      taxId: "",
      bankAccount: {
        accountNumber: "****1234",
        routingNumber: "****5678",
        accountHolder: "John Doe"
      }
    },
    security: {
      twoFactorEnabled: false,
      loginAlerts: true,
      trustedDevices: [
        {
          id: "1",
          name: "Chrome on MacBook",
          lastUsed: "2 hours ago"
        },
        {
          id: "2",
          name: "Safari on iPhone",
          lastUsed: "1 day ago"
        }
      ],
      blockedUsers: [],
      restrictedCountries: []
    },
    preferences: {
      theme: "dark",
      language: "en",
      timezone: "America/Los_Angeles",
      currency: "USD",
      contentWarnings: true,
      autoplay: true,
      highQualityMedia: true,
      soundEnabled: true,
      colorScheme: "purple"
    },
    creator: user?.role === 'creator' ? {
      subscriptionPrice: 14.99,
      subscriptionBundles: [
        { months: 3, discount: 10 },
        { months: 6, discount: 20 },
        { months: 12, discount: 30 }
      ],
      ppvMessagePrice: 5,
      customRequestsEnabled: true,
      customRequestPrice: 50,
      tipsEnabled: true,
      minTipAmount: 5,
      watermarkContent: true,
      contentCategories: ["photos", "videos", "live"],
      ageRestriction: 18
    } : undefined
  };

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<UserSettings>) => {
      const response = await apiRequest("PATCH", "/api/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully",
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
        title: "Failed to update settings",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/account", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted",
      });
      window.location.href = "/";
    },
    onError: (error) => {
      toast({
        title: "Failed to delete account",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const handleProfileUpdate = (field: string, value: any) => {
    updateSettingsMutation.mutate({
      profile: {
        ...mockSettings.profile,
        [field]: value
      }
    });
  };

  const handlePrivacyUpdate = (field: string, value: any) => {
    updateSettingsMutation.mutate({
      privacy: {
        ...mockSettings.privacy,
        [field]: value
      }
    });
  };

  const handleNotificationUpdate = (category: string, field: string, value: boolean) => {
    updateSettingsMutation.mutate({
      notifications: {
        ...mockSettings.notifications,
        [category]: {
          ...mockSettings.notifications[category as keyof typeof mockSettings.notifications],
          [field]: value
        }
      }
    });
  };

  const handlePreferenceUpdate = (field: string, value: any) => {
    updateSettingsMutation.mutate({
      preferences: {
        ...mockSettings.preferences,
        [field]: value
      }
    });
  };

  const handleCreatorSettingUpdate = (field: string, value: any) => {
    if (mockSettings.creator) {
      updateSettingsMutation.mutate({
        creator: {
          ...mockSettings.creator,
          [field]: value
        }
      });
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation === "DELETE") {
      deleteAccountMutation.mutate();
    }
  };

  const removeTrustedDevice = (deviceId: string) => {
    updateSettingsMutation.mutate({
      security: {
        ...mockSettings.security,
        trustedDevices: mockSettings.security.trustedDevices.filter(d => d.id !== deviceId)
      }
    });
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center" data-testid="text-settings-title">
            <SettingsIcon className="w-8 h-8 mr-3 text-primary" />
            Settings
          </h1>
          <p className="text-gray-400">Manage your account and preferences</p>
        </div>

        {/* Settings Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  <button
                    onClick={() => setSelectedTab("profile")}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      selectedTab === "profile" ? "bg-primary text-white" : "text-gray-400 hover:bg-gray-700"
                    }`}
                    data-testid="nav-profile"
                  >
                    <UserIcon className="w-5 h-5" />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => setSelectedTab("privacy")}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      selectedTab === "privacy" ? "bg-primary text-white" : "text-gray-400 hover:bg-gray-700"
                    }`}
                    data-testid="nav-privacy"
                  >
                    <Eye className="w-5 h-5" />
                    <span>Privacy</span>
                  </button>
                  <button
                    onClick={() => setSelectedTab("notifications")}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      selectedTab === "notifications" ? "bg-primary text-white" : "text-gray-400 hover:bg-gray-700"
                    }`}
                    data-testid="nav-notifications"
                  >
                    <Bell className="w-5 h-5" />
                    <span>Notifications</span>
                  </button>
                  <button
                    onClick={() => setSelectedTab("payment")}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      selectedTab === "payment" ? "bg-primary text-white" : "text-gray-400 hover:bg-gray-700"
                    }`}
                    data-testid="nav-payment"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Payment</span>
                  </button>
                  <button
                    onClick={() => setSelectedTab("security")}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      selectedTab === "security" ? "bg-primary text-white" : "text-gray-400 hover:bg-gray-700"
                    }`}
                    data-testid="nav-security"
                  >
                    <Shield className="w-5 h-5" />
                    <span>Security</span>
                  </button>
                  <button
                    onClick={() => setSelectedTab("preferences")}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      selectedTab === "preferences" ? "bg-primary text-white" : "text-gray-400 hover:bg-gray-700"
                    }`}
                    data-testid="nav-preferences"
                  >
                    <Palette className="w-5 h-5" />
                    <span>Preferences</span>
                  </button>
                  {user?.role === 'creator' && (
                    <button
                      onClick={() => setSelectedTab("creator")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        selectedTab === "creator" ? "bg-primary text-white" : "text-gray-400 hover:bg-gray-700"
                      }`}
                      data-testid="nav-creator"
                    >
                      <Star className="w-5 h-5" />
                      <span>Creator Settings</span>
                    </button>
                  )}
                  <Separator className="my-2 bg-gray-700" />
                  <button
                    onClick={() => setShowLogoutDialog(true)}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-700 transition-colors"
                    data-testid="nav-logout"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Log Out</span>
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Settings */}
            {selectedTab === "profile" && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Profile Information</CardTitle>
                  <CardDescription className="text-gray-400">
                    Update your profile details and public information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar and Banner */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white mb-2 block">Profile Picture</Label>
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-20 h-20">
                          <AvatarImage src={mockSettings.profile.avatar} alt="Avatar" />
                          <AvatarFallback>{mockSettings.profile.displayName[0]}</AvatarFallback>
                        </Avatar>
                        <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                          <Upload className="w-4 h-4 mr-2" />
                          Change Avatar
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-white mb-2 block">Banner Image</Label>
                      <div className="relative h-32 bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={mockSettings.profile.banner}
                          alt="Banner"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute bottom-2 right-2 border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Change Banner
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username" className="text-white">Username</Label>
                      <Input
                        id="username"
                        value={mockSettings.profile.username}
                        disabled
                        className="bg-gray-700 border-gray-600 text-gray-400"
                      />
                      <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                    </div>
                    <div>
                      <Label htmlFor="displayName" className="text-white">Display Name</Label>
                      <Input
                        id="displayName"
                        value={mockSettings.profile.displayName}
                        onChange={(e) => handleProfileUpdate("displayName", e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        data-testid="input-display-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-white">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={mockSettings.profile.email}
                        onChange={(e) => handleProfileUpdate("email", e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        data-testid="input-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location" className="text-white">Location</Label>
                      <Input
                        id="location"
                        value={mockSettings.profile.location}
                        onChange={(e) => handleProfileUpdate("location", e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="City, Country"
                        data-testid="input-location"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website" className="text-white">Website</Label>
                      <Input
                        id="website"
                        value={mockSettings.profile.website}
                        onChange={(e) => handleProfileUpdate("website", e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="yourwebsite.com"
                        data-testid="input-website"
                      />
                    </div>
                    <div>
                      <Label htmlFor="birthDate" className="text-white">Birth Date</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={mockSettings.profile.birthDate}
                        onChange={(e) => handleProfileUpdate("birthDate", e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        data-testid="input-birth-date"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <Label htmlFor="bio" className="text-white">Bio</Label>
                    <Textarea
                      id="bio"
                      value={mockSettings.profile.bio}
                      onChange={(e) => handleProfileUpdate("bio", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      rows={4}
                      placeholder="Tell your fanz about yourself..."
                      data-testid="textarea-bio"
                    />
                  </div>

                  <Button className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600">
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Privacy Settings */}
            {selectedTab === "privacy" && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Privacy Settings</CardTitle>
                  <CardDescription className="text-gray-400">
                    Control who can see your content and interact with you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white mb-2 block">Profile Visibility</Label>
                      <Select
                        value={mockSettings.privacy.profileVisibility}
                        onValueChange={(value) => handlePrivacyUpdate("profileVisibility", value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="subscribers">Subscribers Only</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Show Online Status</Label>
                        <p className="text-sm text-gray-400">Let others see when you're online</p>
                      </div>
                      <Switch
                        checked={mockSettings.privacy.showOnlineStatus}
                        onCheckedChange={(checked) => handlePrivacyUpdate("showOnlineStatus", checked)}
                      />
                    </div>

                    <div>
                      <Label className="text-white mb-2 block">Allow Messages From</Label>
                      <Select
                        value={mockSettings.privacy.allowMessages}
                        onValueChange={(value) => handlePrivacyUpdate("allowMessages", value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="everyone">Everyone</SelectItem>
                          <SelectItem value="subscribers">Subscribers Only</SelectItem>
                          <SelectItem value="no-one">No One</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Show Subscriber Count</Label>
                        <p className="text-sm text-gray-400">Display your total subscribers publicly</p>
                      </div>
                      <Switch
                        checked={mockSettings.privacy.showSubscriberCount}
                        onCheckedChange={(checked) => handlePrivacyUpdate("showSubscriberCount", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Hide From Search</Label>
                        <p className="text-sm text-gray-400">Don't appear in search results</p>
                      </div>
                      <Switch
                        checked={mockSettings.privacy.hideFromSearch}
                        onCheckedChange={(checked) => handlePrivacyUpdate("hideFromSearch", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Allow Tagging</Label>
                        <p className="text-sm text-gray-400">Let others tag you in posts</p>
                      </div>
                      <Switch
                        checked={mockSettings.privacy.allowTagging}
                        onCheckedChange={(checked) => handlePrivacyUpdate("allowTagging", checked)}
                      />
                    </div>

                    {user?.role === 'creator' && (
                      <>
                        <Separator className="bg-gray-700" />
                        <div>
                          <Label className="text-white mb-2 block">Default Content Privacy</Label>
                          <Select
                            value={mockSettings.privacy.contentDefault}
                            onValueChange={(value) => handlePrivacyUpdate("contentDefault", value)}
                          >
                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              <SelectItem value="public">Public</SelectItem>
                              <SelectItem value="subscribers">Subscribers Only</SelectItem>
                              <SelectItem value="ppv">Pay Per View</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-white">Show Earnings</Label>
                            <p className="text-sm text-gray-400">Display earnings on profile</p>
                          </div>
                          <Switch
                            checked={mockSettings.privacy.showEarnings}
                            onCheckedChange={(checked) => handlePrivacyUpdate("showEarnings", checked)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notification Settings */}
            {selectedTab === "notifications" && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Notification Preferences</CardTitle>
                  <CardDescription className="text-gray-400">
                    Choose how you want to be notified about activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email Notifications */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Mail className="w-5 h-5 mr-2" />
                      Email Notifications
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(mockSettings.notifications.email).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <Label className="text-white">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Label>
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) => handleNotificationUpdate("email", key, checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  {/* Push Notifications */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Smartphone className="w-5 h-5 mr-2" />
                      Push Notifications
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(mockSettings.notifications.push).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <Label className="text-white">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Label>
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) => handleNotificationUpdate("push", key, checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  {/* SMS Notifications */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      SMS Notifications
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Enable SMS Notifications</Label>
                        <Switch
                          checked={mockSettings.notifications.sms.enabled}
                          onCheckedChange={(checked) => handleNotificationUpdate("sms", "enabled", checked)}
                        />
                      </div>
                      {mockSettings.notifications.sms.enabled && (
                        <>
                          <Input
                            placeholder="Phone Number"
                            value={mockSettings.notifications.sms.phoneNumber}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                          <div className="flex items-center justify-between">
                            <Label className="text-white">Important Notifications Only</Label>
                            <Switch
                              checked={mockSettings.notifications.sms.importantOnly}
                              onCheckedChange={(checked) => handleNotificationUpdate("sms", "importantOnly", checked)}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Settings */}
            {selectedTab === "payment" && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Payment & Billing</CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage your payment methods and payout settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {user?.role === 'creator' && (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Payout Settings</h3>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-white mb-2 block">Payout Method</Label>
                            <Select value={mockSettings.payment.payoutMethod}>
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                <SelectItem value="bank">Bank Transfer</SelectItem>
                                <SelectItem value="paypal">PayPal</SelectItem>
                                <SelectItem value="crypto">Cryptocurrency</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-white mb-2 block">Payout Schedule</Label>
                            <Select value={mockSettings.payment.payoutSchedule}>
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-white mb-2 block">
                              Minimum Payout Amount (${mockSettings.payment.minPayout})
                            </Label>
                            <Slider
                              value={[mockSettings.payment.minPayout]}
                              onValueChange={([value]) => handleProfileUpdate("minPayout", value)}
                              max={1000}
                              min={50}
                              step={50}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-gray-700" />
                    </>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Payment Methods</h3>
                    <div className="space-y-3">
                      <Card className="bg-gray-700 border-gray-600">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CreditCard className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-white font-medium">•••• •••• •••• 4242</p>
                              <p className="text-sm text-gray-400">Expires 12/24</p>
                            </div>
                          </div>
                          <Badge className="bg-green-900 text-green-400">Default</Badge>
                        </CardContent>
                      </Card>
                      <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Payment Method
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Billing History</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-white">January 2024</p>
                          <p className="text-sm text-gray-400">Subscription renewal</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white">$14.99</p>
                          <Badge className="bg-green-900 text-green-400">Paid</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-white">December 2023</p>
                          <p className="text-sm text-gray-400">PPV purchases</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white">$45.97</p>
                          <Badge className="bg-green-900 text-green-400">Paid</Badge>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" className="w-full mt-2 text-gray-400 hover:text-white">
                      View All Transactions
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Settings */}
            {selectedTab === "security" && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Security Settings</CardTitle>
                  <CardDescription className="text-gray-400">
                    Keep your account safe and secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-8 h-8 text-green-500" />
                        <div>
                          <p className="text-white font-medium">Two-Factor Authentication</p>
                          <p className="text-sm text-gray-400">Add an extra layer of security</p>
                        </div>
                      </div>
                      <Switch
                        checked={mockSettings.security.twoFactorEnabled}
                        onCheckedChange={(checked) => updateSettingsMutation.mutate({
                          security: { ...mockSettings.security, twoFactorEnabled: checked }
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Login Alerts</Label>
                        <p className="text-sm text-gray-400">Get notified of new login attempts</p>
                      </div>
                      <Switch
                        checked={mockSettings.security.loginAlerts}
                        onCheckedChange={(checked) => updateSettingsMutation.mutate({
                          security: { ...mockSettings.security, loginAlerts: checked }
                        })}
                      />
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Trusted Devices</h3>
                    <div className="space-y-3">
                      {mockSettings.security.trustedDevices.map((device) => (
                        <div key={device.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Smartphone className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-white">{device.name}</p>
                              <p className="text-sm text-gray-400">Last used: {device.lastUsed}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTrustedDevice(device.id)}
                            className="text-red-500 hover:text-red-400"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Password</h3>
                    <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      <Key className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 text-red-500">Danger Zone</h3>
                    <div className="space-y-3">
                      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="border-red-600 text-red-500 hover:bg-red-900/20">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Account
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-800 border-gray-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">Delete Account</DialogTitle>
                            <DialogDescription className="text-gray-400">
                              This action cannot be undone. All your data will be permanently deleted.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="p-3 bg-red-900/20 border border-red-600 rounded">
                              <p className="text-red-500 text-sm">
                                Warning: You will lose access to all your content, subscriptions, and earnings.
                              </p>
                            </div>
                            <div>
                              <Label className="text-white">Type DELETE to confirm</Label>
                              <Input
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                className="bg-gray-700 border-gray-600 text-white"
                                placeholder="DELETE"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setShowDeleteDialog(false)}
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleDeleteAccount}
                              disabled={deleteConfirmation !== "DELETE"}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Account
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preferences */}
            {selectedTab === "preferences" && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Preferences</CardTitle>
                  <CardDescription className="text-gray-400">
                    Customize your experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white mb-2 block">Theme</Label>
                      <Select
                        value={mockSettings.preferences.theme}
                        onValueChange={(value) => handlePreferenceUpdate("theme", value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white mb-2 block">Language</Label>
                      <Select
                        value={mockSettings.preferences.language}
                        onValueChange={(value) => handlePreferenceUpdate("language", value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white mb-2 block">Timezone</Label>
                      <Select
                        value={mockSettings.preferences.timezone}
                        onValueChange={(value) => handlePreferenceUpdate("timezone", value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white mb-2 block">Currency</Label>
                      <Select
                        value={mockSettings.preferences.currency}
                        onValueChange={(value) => handlePreferenceUpdate("currency", value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="CAD">CAD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Content Warnings</Label>
                        <p className="text-sm text-gray-400">Show warnings for sensitive content</p>
                      </div>
                      <Switch
                        checked={mockSettings.preferences.contentWarnings}
                        onCheckedChange={(checked) => handlePreferenceUpdate("contentWarnings", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Autoplay Videos</Label>
                        <p className="text-sm text-gray-400">Automatically play videos in feed</p>
                      </div>
                      <Switch
                        checked={mockSettings.preferences.autoplay}
                        onCheckedChange={(checked) => handlePreferenceUpdate("autoplay", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">High Quality Media</Label>
                        <p className="text-sm text-gray-400">Load high resolution images and videos</p>
                      </div>
                      <Switch
                        checked={mockSettings.preferences.highQualityMedia}
                        onCheckedChange={(checked) => handlePreferenceUpdate("highQualityMedia", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Sound Effects</Label>
                        <p className="text-sm text-gray-400">Play sounds for notifications and actions</p>
                      </div>
                      <Switch
                        checked={mockSettings.preferences.soundEnabled}
                        onCheckedChange={(checked) => handlePreferenceUpdate("soundEnabled", checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Creator Settings */}
            {selectedTab === "creator" && user?.role === 'creator' && mockSettings.creator && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Creator Settings</CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage your creator account and monetization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Subscription Pricing</h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white mb-2 block">
                          Monthly Subscription (${mockSettings.creator.subscriptionPrice})
                        </Label>
                        <div className="flex items-center space-x-4">
                          <Slider
                            value={[mockSettings.creator.subscriptionPrice]}
                            onValueChange={([value]) => handleCreatorSettingUpdate("subscriptionPrice", value)}
                            max={100}
                            min={5}
                            step={0.99}
                            className="flex-1"
                          />
                          <span className="text-white w-16 text-right">
                            ${mockSettings.creator.subscriptionPrice}
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Bundle Discounts</Label>
                        {mockSettings.creator?.subscriptionBundles?.map((bundle) => (
                          <div key={bundle.months} className="flex items-center justify-between py-2">
                            <span className="text-gray-400">{bundle.months} months</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-white">{bundle.discount}% off</span>
                              <Badge className="bg-green-900 text-green-400">
                                ${((mockSettings.creator?.subscriptionPrice || 0) * bundle.months * (1 - bundle.discount/100)).toFixed(2)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Content Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Tips Enabled</Label>
                          <p className="text-sm text-gray-400">Allow fanz to send tips</p>
                        </div>
                        <Switch
                          checked={mockSettings.creator.tipsEnabled}
                          onCheckedChange={(checked) => handleCreatorSettingUpdate("tipsEnabled", checked)}
                        />
                      </div>

                      {mockSettings.creator.tipsEnabled && (
                        <div>
                          <Label className="text-white mb-2 block">
                            Minimum Tip Amount (${mockSettings.creator.minTipAmount})
                          </Label>
                          <Slider
                            value={[mockSettings.creator.minTipAmount]}
                            onValueChange={([value]) => handleCreatorSettingUpdate("minTipAmount", value)}
                            max={100}
                            min={1}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Custom Requests</Label>
                          <p className="text-sm text-gray-400">Accept custom content requests</p>
                        </div>
                        <Switch
                          checked={mockSettings.creator.customRequestsEnabled}
                          onCheckedChange={(checked) => handleCreatorSettingUpdate("customRequestsEnabled", checked)}
                        />
                      </div>

                      {mockSettings.creator.customRequestsEnabled && (
                        <div>
                          <Label className="text-white mb-2 block">
                            Custom Request Price (${mockSettings.creator.customRequestPrice})
                          </Label>
                          <Slider
                            value={[mockSettings.creator.customRequestPrice]}
                            onValueChange={([value]) => handleCreatorSettingUpdate("customRequestPrice", value)}
                            max={500}
                            min={10}
                            step={5}
                            className="w-full"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Watermark Content</Label>
                          <p className="text-sm text-gray-400">Add watermark to media</p>
                        </div>
                        <Switch
                          checked={mockSettings.creator.watermarkContent}
                          onCheckedChange={(checked) => handleCreatorSettingUpdate("watermarkContent", checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Logout Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Log Out</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to log out of your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}