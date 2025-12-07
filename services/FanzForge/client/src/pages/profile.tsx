import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [linkedin, setLinkedin] = useState("");

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/user/profile", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating profile:", error);
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      firstName,
      lastName,
      email,
      bio,
      website,
      twitter,
      linkedin,
    });
  };

  const handleImageUpload = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Profile image upload will be available soon!",
    });
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="mb-8">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  onClick={() => setLocation("/")}
                  className="mb-4"
                  data-testid="button-back"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back to Dashboard
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Return to your main dashboard</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
                <p className="text-muted-foreground">
                  Manage your account settings and personal information.
                </p>
              </div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Badge variant="secondary" className="px-3 py-1">
                  <i className="fas fa-crown mr-2 text-yellow-400"></i>
                  Pro Member
                </Badge>
              </motion.div>
            </div>
          </div>

          <Tabs defaultValue="general" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general" data-testid="tab-general">
                <i className="fas fa-user mr-2"></i>General
              </TabsTrigger>
              <TabsTrigger value="security" data-testid="tab-security">
                <i className="fas fa-shield-alt mr-2"></i>Security
              </TabsTrigger>
              <TabsTrigger value="notifications" data-testid="tab-notifications">
                <i className="fas fa-bell mr-2"></i>Notifications
              </TabsTrigger>
              <TabsTrigger value="appearance" data-testid="tab-appearance">
                <i className="fas fa-palette mr-2"></i>Appearance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal details and profile settings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profile Picture Section */}
                    <div className="flex items-center space-x-6">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
                        <AvatarFallback className="bg-gradient-to-r from-secondary to-accent text-2xl">
                          {user?.firstName?.[0] || user?.email?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-medium mb-2">Profile Picture</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Upload a new profile picture to personalize your account.
                        </p>
                        <div className="flex space-x-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                onClick={handleImageUpload}
                                size="sm"
                                data-testid="button-upload-image"
                              >
                                <i className="fas fa-upload mr-2"></i>
                                Upload New
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Upload a new profile picture (JPG, PNG, max 5MB)</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" data-testid="button-remove-image">
                                <i className="fas fa-trash mr-2"></i>
                                Remove
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remove your current profile picture</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>

                    {/* Personal Information */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input
                              id="firstName"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              placeholder="Enter your first name"
                              data-testid="input-first-name"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Your first name as it appears on your profile</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input
                              id="lastName"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              placeholder="Enter your last name"
                              data-testid="input-last-name"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Your last name as it appears on your profile</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            data-testid="input-email"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Your email address for login and notifications</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                            className="min-h-[100px]"
                            data-testid="textarea-bio"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>A brief description about yourself (optional)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Social Links</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="website">Website</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Input
                                id="website"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                placeholder="https://yourwebsite.com"
                                data-testid="input-website"
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Your personal or business website</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="twitter">Twitter</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Input
                                id="twitter"
                                value={twitter}
                                onChange={(e) => setTwitter(e.target.value)}
                                placeholder="@yourusername"
                                data-testid="input-twitter"
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Your Twitter/X username</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setFirstName(user?.firstName || "");
                              setLastName(user?.lastName || "");
                              setEmail(user?.email || "");
                              setBio("");
                              setWebsite("");
                              setTwitter("");
                            }}
                            data-testid="button-reset"
                          >
                            <i className="fas fa-undo mr-2"></i>
                            Reset
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Reset all fields to their original values</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            onClick={handleSaveProfile}
                            disabled={updateProfileMutation.isPending}
                            data-testid="button-save-profile"
                          >
                            {updateProfileMutation.isPending ? (
                              <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Saving...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-save mr-2"></i>
                                Save Changes
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Save your profile changes</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Manage your account security and privacy settings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <i className="fas fa-key text-green-400"></i>
                          <div>
                            <p className="font-medium">Password</p>
                            <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                          </div>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" data-testid="button-change-password">
                              <i className="fas fa-edit mr-2"></i>
                              Change
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Change your account password</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <i className="fas fa-shield-alt text-blue-400"></i>
                          <div>
                            <p className="font-medium">Two-Factor Authentication</p>
                            <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                          </div>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" data-testid="button-enable-2fa">
                              <i className="fas fa-plus mr-2"></i>
                              Enable
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enable two-factor authentication for enhanced security</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <i className="fas fa-devices text-purple-400"></i>
                          <div>
                            <p className="font-medium">Active Sessions</p>
                            <p className="text-sm text-muted-foreground">Manage your active login sessions</p>
                          </div>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" data-testid="button-manage-sessions">
                              <i className="fas fa-cog mr-2"></i>
                              Manage
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View and manage your active login sessions</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Choose what notifications you want to receive.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {[
                        { id: 'project-updates', label: 'Project Updates', description: 'Notifications about your project builds and deployments', icon: 'fas fa-rocket' },
                        { id: 'team-activity', label: 'Team Activity', description: 'Updates from team members and collaborators', icon: 'fas fa-users' },
                        { id: 'billing-alerts', label: 'Billing Alerts', description: 'Important billing and payment notifications', icon: 'fas fa-credit-card' },
                        { id: 'security-alerts', label: 'Security Alerts', description: 'Login attempts and security-related notifications', icon: 'fas fa-shield-alt' },
                        { id: 'marketing', label: 'Marketing & Updates', description: 'News, updates, and promotional content', icon: 'fas fa-bullhorn' }
                      ].map((notification) => (
                        <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <i className={`${notification.icon} text-primary`}></i>
                            <div>
                              <p className="font-medium">{notification.label}</p>
                              <p className="text-sm text-muted-foreground">{notification.description}</p>
                            </div>
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" data-testid={`toggle-${notification.id}`}>
                                <i className="fas fa-toggle-on mr-2 text-green-400"></i>
                                Enabled
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Click to disable {notification.label.toLowerCase()}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance Settings</CardTitle>
                    <CardDescription>
                      Customize how the application looks and feels.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <i className="fas fa-moon text-purple-400"></i>
                          <div>
                            <p className="font-medium">Dark Mode</p>
                            <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
                          </div>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" data-testid="button-toggle-theme">
                              <i className="fas fa-toggle-on mr-2 text-green-400"></i>
                              Enabled
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Toggle between light and dark mode</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <i className="fas fa-magic text-pink-400"></i>
                          <div>
                            <p className="font-medium">Animations</p>
                            <p className="text-sm text-muted-foreground">Enable or disable interface animations</p>
                          </div>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" data-testid="button-toggle-animations">
                              <i className="fas fa-toggle-on mr-2 text-green-400"></i>
                              Enabled
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enable or disable smooth animations</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}