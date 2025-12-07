import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { mockUser, platforms } from '@/lib/mockData';

interface MobileProfileProps {
  onPageChange: (page: string) => void;
}

export default function MobileProfile({ onPageChange }: MobileProfileProps) {
  const profileStats = [
    { label: 'Total Earnings', value: '$12,847', icon: '💰' },
    { label: 'Followers', value: '2.1K', icon: '👥' },
    { label: 'Content', value: '47', icon: '📁' },
    { label: 'Rating', value: '4.9', icon: '⭐' }
  ];

  const settingsItems = [
    { label: 'Notifications', icon: '🔔', hasSwitch: true, enabled: true },
    { label: 'Auto-Upload', icon: '📤', hasSwitch: true, enabled: false },
    { label: 'Privacy Settings', icon: '🔒', hasSwitch: false },
    { label: 'Payment Methods', icon: '💳', hasSwitch: false },
    { label: 'Tax Documents', icon: '📄', hasSwitch: false },
    { label: 'Help & Support', icon: '❓', hasSwitch: false },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Profile</h1>
        <Button variant="ghost" size="sm">
          ⚙️
        </Button>
      </div>

      {/* Profile Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="/avatars/01.png" alt="@alexcreator" />
              <AvatarFallback>AC</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{mockUser.handle}</h2>
              <p className="text-sm text-muted-foreground">{mockUser.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={`${
                  mockUser.platform === 'BoyFanz' ? 'bg-blue-600' :
                  mockUser.platform === 'GirlFanz' ? 'bg-pink-600' : 'bg-purple-600'
                }`}>
                  {mockUser.platform}
                </Badge>
                {mockUser.verified_at && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    ✓ Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Button variant="outline" className="w-full mt-4">
            Edit Profile
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {profileStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-3 text-center">
              <div className="text-lg">{stat.icon}</div>
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Connected Platforms */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Connected Platforms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {platforms.map((platform) => (
            <div key={platform.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full ${platform.color} flex items-center justify-center text-white text-xs font-bold`}>
                  {platform.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">{platform.name}</p>
                  <p className="text-xs text-muted-foreground">{platform.users} users</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
          
          <Button variant="outline" size="sm" className="w-full mt-3">
            + Connect New Platform
          </Button>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {settingsItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {item.hasSwitch ? (
                <Switch defaultChecked={item.enabled} />
              ) : (
                <Button variant="ghost" size="sm">
                  →
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Account Actions */}
      <div className="space-y-2">
        <Button variant="outline" className="w-full justify-start">
          <span className="mr-3">📊</span>
          View Analytics
        </Button>
        
        <Button variant="outline" className="w-full justify-start">
          <span className="mr-3">💸</span>
          Withdraw Earnings
        </Button>
        
        <Button variant="outline" className="w-full justify-start text-red-600 border-red-200">
          <span className="mr-3">🚪</span>
          Sign Out
        </Button>
      </div>

      {/* App Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground">
            FANZ Mobile App v2.1.0
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            © 2024 FANZ Unlimited Network
          </p>
        </CardContent>
      </Card>
    </div>
  );
}