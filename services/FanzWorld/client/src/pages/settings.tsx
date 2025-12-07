import { useState } from "react";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { 
  User as UserIcon, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Download,
  Trash2,
  ChevronRight,
  Moon,
  Sun,
  Monitor 
} from "lucide-react";

type SettingsSection = 'profile' | 'notifications' | 'privacy' | 'appearance' | 'accessibility';

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  return (
    <div className="min-h-screen bg-black text-white cyber-grid">
      <Header />
      
      <div className="flex flex-col lg:flex-row pt-14 sm:pt-16 pb-16 lg:pb-0">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        <main className="flex-1 lg:ml-64 max-w-full lg:max-w-4xl mx-auto p-3 sm:p-4 lg:p-6">
          {/* Header */}
          <div className="post-card p-6 rounded-xl mb-6">
            <h1 className="text-2xl font-bold text-cyber-blue neon-text">
              Settings
            </h1>
            <p className="text-gray-400 mt-2">
              Manage your account and customize your experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Settings Navigation */}
            <div className="lg:col-span-1">
              <div className="post-card p-4 rounded-xl space-y-2">
                <Button
                  variant="ghost"
                  onClick={() => setActiveSection('profile')}
                  className={`w-full justify-start p-3 rounded-lg transition-colors ${
                    activeSection === 'profile'
                      ? 'text-cyber-blue bg-cyber-blue/10'
                      : 'text-gray-400 hover:text-cyber-blue hover:bg-cyber-blue/10'
                  }`}
                  data-testid="profile-settings"
                >
                  <UserIcon className="w-5 h-5 mr-3" />
                  Profile
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setActiveSection('notifications')}
                  className={`w-full justify-start p-3 rounded-lg transition-colors ${
                    activeSection === 'notifications'
                      ? 'text-electric-purple bg-electric-purple/10'
                      : 'text-gray-400 hover:text-electric-purple hover:bg-electric-purple/10'
                  }`}
                  data-testid="notification-settings"
                >
                  <Bell className="w-5 h-5 mr-3" />
                  Notifications
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setActiveSection('privacy')}
                  className={`w-full justify-start p-3 rounded-lg transition-colors ${
                    activeSection === 'privacy'
                      ? 'text-neon-pink bg-neon-pink/10'
                      : 'text-gray-400 hover:text-neon-pink hover:bg-neon-pink/10'
                  }`}
                  data-testid="privacy-settings"
                >
                  <Shield className="w-5 h-5 mr-3" />
                  Privacy
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setActiveSection('appearance')}
                  className={`w-full justify-start p-3 rounded-lg transition-colors ${
                    activeSection === 'appearance'
                      ? 'text-laser-green bg-laser-green/10'
                      : 'text-gray-400 hover:text-laser-green hover:bg-laser-green/10'
                  }`}
                  data-testid="appearance-settings"
                >
                  <Palette className="w-5 h-5 mr-3" />
                  Appearance
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setActiveSection('accessibility')}
                  className={`w-full justify-start p-3 rounded-lg transition-colors ${
                    activeSection === 'accessibility'
                      ? 'text-cyber-blue bg-cyber-blue/10'
                      : 'text-gray-400 hover:text-cyber-blue hover:bg-cyber-blue/10'
                  }`}
                  data-testid="accessibility-settings"
                >
                  <Globe className="w-5 h-5 mr-3" />
                  Accessibility
                </Button>
              </div>
            </div>
            
            {/* Settings Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Profile Settings */}
              {activeSection === 'profile' && (
                <div className="post-card p-6 rounded-xl">
                  <h2 className="text-xl font-bold text-cyber-blue mb-4 neon-text">
                    Profile Information
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Display Name
                      </label>
                      <Input
                        type="text"
                        defaultValue={user?.displayName || "Alex Chen"}
                        className="cyber-input w-full"
                        data-testid="display-name-input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Username
                      </label>
                      <Input
                        type="text"
                        defaultValue={user?.username || "alex_chen"}
                        className="cyber-input w-full"
                        data-testid="username-input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Bio
                      </label>
                      <Textarea
                        defaultValue={user?.bio || "Full-stack developer building the future"}
                        className="cyber-input w-full min-h-[100px]"
                        data-testid="bio-input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Website
                      </label>
                      <Input
                        type="url"
                        placeholder="https://alexchen.dev"
                        className="cyber-input w-full"
                        data-testid="website-input"
                      />
                    </div>
                    
                    <Button
                      className="neon-button bg-gradient-to-r from-cyber-blue to-electric-purple text-black font-bold px-6 py-2 rounded-full border-cyber-blue hover:shadow-neon-cyan transition-all duration-300"
                      data-testid="save-profile"
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Notification Settings */}
              {activeSection === 'notifications' && (
                <div className="post-card p-6 rounded-xl">
                  <h2 className="text-xl font-bold text-electric-purple mb-4 neon-text">
                    Notification Preferences
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-700">
                      <div>
                        <h3 className="font-medium text-white">Push Notifications</h3>
                        <p className="text-sm text-gray-400">Receive notifications on your device</p>
                      </div>
                      <Switch defaultChecked data-testid="push-notifications" />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-700">
                      <div>
                        <h3 className="font-medium text-white">Email Notifications</h3>
                        <p className="text-sm text-gray-400">Receive email updates</p>
                      </div>
                      <Switch defaultChecked data-testid="email-notifications" />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-700">
                      <div>
                        <h3 className="font-medium text-white">New Followers</h3>
                        <p className="text-sm text-gray-400">Get notified when someone follows you</p>
                      </div>
                      <Switch defaultChecked data-testid="follower-notifications" />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-700">
                      <div>
                        <h3 className="font-medium text-white">Likes & Comments</h3>
                        <p className="text-sm text-gray-400">Get notified about post interactions</p>
                      </div>
                      <Switch defaultChecked data-testid="interaction-notifications" />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Privacy Settings */}
              {activeSection === 'privacy' && (
                <>
                  <div className="post-card p-6 rounded-xl">
                    <h2 className="text-xl font-bold text-neon-pink mb-4 neon-text">
                      Privacy & Security
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg border border-gray-700">
                        <div>
                          <h3 className="font-medium text-white">Private Account</h3>
                          <p className="text-sm text-gray-400">Require approval for new followers</p>
                        </div>
                        <Switch data-testid="private-account" />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 rounded-lg border border-gray-700">
                        <div>
                          <h3 className="font-medium text-white">Two-Factor Authentication</h3>
                          <p className="text-sm text-gray-400">Add extra security to your account</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-cyber-blue text-cyber-blue hover:bg-cyber-blue hover:text-black"
                          data-testid="setup-2fa"
                        >
                          Setup
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 rounded-lg border border-gray-700">
                        <div>
                          <h3 className="font-medium text-white">Data Download</h3>
                          <p className="text-sm text-gray-400">Download your account data</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-laser-green text-laser-green hover:bg-laser-green hover:text-black"
                          data-testid="download-data"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Danger Zone */}
                  <div className="post-card p-6 rounded-xl border border-red-500/30">
                    <h2 className="text-xl font-bold text-red-400 mb-4">
                      Danger Zone
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg border border-red-500/30 bg-red-500/5">
                        <div>
                          <h3 className="font-medium text-white">Delete Account</h3>
                          <p className="text-sm text-gray-400">Permanently delete your account and all data</p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                          data-testid="delete-account"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Appearance Settings */}
              {activeSection === 'appearance' && (
                <div className="post-card p-6 rounded-xl">
                  <h2 className="text-xl font-bold text-laser-green mb-4 neon-text">
                    Appearance
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Theme</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-700 bg-gray-800/50">
                          <input
                            type="radio"
                            id="dark-theme"
                            name="theme"
                            defaultChecked
                            className="w-4 h-4 text-laser-green"
                            data-testid="dark-theme"
                          />
                          <Moon className="w-5 h-5 text-laser-green" />
                          <label htmlFor="dark-theme" className="text-white">Dark</label>
                        </div>
                        <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-700">
                          <input
                            type="radio"
                            id="light-theme"
                            name="theme"
                            className="w-4 h-4 text-laser-green"
                            data-testid="light-theme"
                          />
                          <Sun className="w-5 h-5 text-yellow-400" />
                          <label htmlFor="light-theme" className="text-white">Light</label>
                        </div>
                        <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-700">
                          <input
                            type="radio"
                            id="auto-theme"
                            name="theme"
                            className="w-4 h-4 text-laser-green"
                            data-testid="auto-theme"
                          />
                          <Monitor className="w-5 h-5 text-gray-400" />
                          <label htmlFor="auto-theme" className="text-white">Auto</label>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-700">
                      <div>
                        <h3 className="font-medium text-white">Reduced Motion</h3>
                        <p className="text-sm text-gray-400">Minimize animations and transitions</p>
                      </div>
                      <Switch data-testid="reduced-motion" />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-700">
                      <div>
                        <h3 className="font-medium text-white">Compact Mode</h3>
                        <p className="text-sm text-gray-400">Use smaller spacing and denser layouts</p>
                      </div>
                      <Switch data-testid="compact-mode" />
                    </div>
                  </div>
                </div>
              )}

              {/* Accessibility Settings */}
              {activeSection === 'accessibility' && (
                <div className="post-card p-6 rounded-xl">
                  <h2 className="text-xl font-bold text-cyber-blue mb-4 neon-text">
                    Accessibility
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-700">
                      <div>
                        <h3 className="font-medium text-white">High Contrast</h3>
                        <p className="text-sm text-gray-400">Increase contrast for better visibility</p>
                      </div>
                      <Switch data-testid="high-contrast" />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-700">
                      <div>
                        <h3 className="font-medium text-white">Large Text</h3>
                        <p className="text-sm text-gray-400">Use larger font sizes throughout the app</p>
                      </div>
                      <Switch data-testid="large-text" />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-700">
                      <div>
                        <h3 className="font-medium text-white">Screen Reader Support</h3>
                        <p className="text-sm text-gray-400">Enhanced compatibility with screen readers</p>
                      </div>
                      <Switch defaultChecked data-testid="screen-reader" />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-700">
                      <div>
                        <h3 className="font-medium text-white">Keyboard Navigation</h3>
                        <p className="text-sm text-gray-400">Enhanced keyboard shortcuts and navigation</p>
                      </div>
                      <Switch defaultChecked data-testid="keyboard-nav" />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-700">
                      <div>
                        <h3 className="font-medium text-white">Alternative Text</h3>
                        <p className="text-sm text-gray-400">Show alternative text for images</p>
                      </div>
                      <Switch defaultChecked data-testid="alt-text" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}