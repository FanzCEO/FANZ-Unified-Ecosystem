import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import {
  Share2, Instagram, Twitter, Youtube, Music2, QrCode,
  Link, Calendar as CalendarIcon, Clock, Globe, Lock,
  DollarSign, Hash, Users, TrendingUp, CheckCircle, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DistributionSettingsProps = {
  sessionId: string;
  onDistribute: () => void;
};

type Platform = {
  id: string;
  name: string;
  icon: any;
  enabled: boolean;
  connected: boolean;
};

type DistributionSettings = {
  platforms: string[];
  publishSchedule: 'now' | 'scheduled';
  scheduledDate?: Date;
  scheduledTime?: string;
  caption: string;
  hashtags: string[];
  visibility: 'public' | 'followers' | 'paid';
  price?: number;
  generateQrCode: boolean;
  generateSmartLink: boolean;
  autoRetargeting: boolean;
  crossPromote: boolean;
  notifyFollowers: boolean;
};

export default function DistributionSettings({ sessionId, onDistribute }: DistributionSettingsProps) {
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: 'instagram', name: 'Instagram', icon: Instagram, enabled: true, connected: true },
    { id: 'tiktok', name: 'TikTok', icon: Music2, enabled: true, connected: true },
    { id: 'twitter', name: 'Twitter', icon: Twitter, enabled: false, connected: true },
    { id: 'youtube', name: 'YouTube', icon: Youtube, enabled: false, connected: false },
  ]);
  
  const [settings, setSettings] = useState<DistributionSettings>({
    platforms: ['instagram', 'tiktok'],
    publishSchedule: 'now',
    caption: '',
    hashtags: [],
    visibility: 'public',
    generateQrCode: true,
    generateSmartLink: true,
    autoRetargeting: true,
    crossPromote: true,
    notifyFollowers: true,
  });

  const [hashtagInput, setHashtagInput] = useState('');
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const { toast } = useToast();

  // Create distribution campaign
  const distributeMutation = useMutation({
    mutationFn: () =>
      apiRequest('/api/creator/content/distribute', {
        method: 'POST',
        body: {
          sessionId,
          platforms: settings.platforms,
          publishSchedule: settings.publishSchedule === 'scheduled' ? {
            date: settings.scheduledDate?.toISOString(),
            time: settings.scheduledTime,
          } : null,
          settings: {
            caption: settings.caption,
            hashtags: settings.hashtags,
            visibility: settings.visibility,
            price: settings.price,
            generateQrCode: settings.generateQrCode,
            generateSmartLink: settings.generateSmartLink,
            autoRetargeting: settings.autoRetargeting,
            crossPromote: settings.crossPromote,
            notifyFollowers: settings.notifyFollowers,
          },
        },
      }),
    onSuccess: () => {
      onDistribute();
      toast({
        title: 'Distribution started!',
        description: settings.publishSchedule === 'now' 
          ? 'Your content is being distributed to selected platforms.'
          : `Your content will be published on ${format(settings.scheduledDate!, 'PPP')}`,
      });
    },
    onError: () => {
      toast({
        title: 'Distribution failed',
        description: 'Please check your platform connections and try again.',
        variant: 'destructive',
      });
    },
  });

  const togglePlatform = (platformId: string) => {
    setPlatforms(platforms.map(p => {
      if (p.id === platformId) {
        const newEnabled = !p.enabled;
        
        // Update settings.platforms
        if (newEnabled) {
          setSettings({
            ...settings,
            platforms: [...settings.platforms, platformId],
          });
        } else {
          setSettings({
            ...settings,
            platforms: settings.platforms.filter(id => id !== platformId),
          });
        }
        
        return { ...p, enabled: newEnabled };
      }
      return p;
    }));
  };

  const addHashtag = () => {
    if (hashtagInput && !settings.hashtags.includes(hashtagInput)) {
      setSettings({
        ...settings,
        hashtags: [...settings.hashtags, hashtagInput],
      });
      setHashtagInput('');
    }
  };

  const removeHashtag = (hashtag: string) => {
    setSettings({
      ...settings,
      hashtags: settings.hashtags.filter(h => h !== hashtag),
    });
  };

  const getSuggestedHashtags = () => {
    return ['trending', 'viral', 'fyp', 'foryou', 'exclusive', 'premium'];
  };

  return (
    <div className="space-y-6">
      {/* Platform Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Platforms</CardTitle>
          <CardDescription>
            Choose where to distribute your content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {platforms.map((platform) => (
              <div
                key={platform.id}
                className={cn(
                  "relative p-4 rounded-lg border-2 transition-all cursor-pointer",
                  platform.enabled
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => platform.connected && togglePlatform(platform.id)}
                data-testid={`platform-${platform.id}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <platform.icon className="h-8 w-8" />
                  <span className="text-sm font-medium">{platform.name}</span>
                  {!platform.connected && (
                    <Badge variant="outline" className="text-xs">
                      Not Connected
                    </Badge>
                  )}
                </div>
                {platform.enabled && (
                  <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-primary" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Content Settings</CardTitle>
          <CardDescription>
            Customize your post details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="Write an engaging caption..."
              value={settings.caption}
              onChange={(e) => setSettings({ ...settings, caption: e.target.value })}
              rows={4}
              data-testid="textarea-caption"
            />
            <p className="text-xs text-muted-foreground">
              AI tip: Use emojis and a call-to-action for better engagement
            </p>
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <Label htmlFor="hashtags">Hashtags</Label>
            <div className="flex gap-2">
              <Input
                id="hashtags"
                placeholder="Add hashtag..."
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                data-testid="input-hashtag"
              />
              <Button onClick={addHashtag} size="sm" data-testid="button-add-hashtag">
                <Hash className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Current Hashtags */}
            {settings.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {settings.hashtags.map((hashtag) => (
                  <Badge
                    key={hashtag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeHashtag(hashtag)}
                    data-testid={`hashtag-${hashtag}`}
                  >
                    #{hashtag} ×
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Suggested Hashtags */}
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs text-muted-foreground">Suggested:</span>
              {getSuggestedHashtags().map((hashtag) => (
                <Badge
                  key={hashtag}
                  variant="outline"
                  className="cursor-pointer text-xs"
                  onClick={() => {
                    setHashtagInput(hashtag);
                    addHashtag();
                  }}
                  data-testid={`suggested-${hashtag}`}
                >
                  +#{hashtag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select
              value={settings.visibility}
              onValueChange={(value: any) => setSettings({ ...settings, visibility: value })}
            >
              <SelectTrigger data-testid="select-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Public - Everyone can see
                  </div>
                </SelectItem>
                <SelectItem value="followers">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Followers Only
                  </div>
                </SelectItem>
                <SelectItem value="paid">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Paid Content
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price (if paid) */}
          {settings.visibility === 'paid' && (
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                min="0.99"
                step="0.01"
                placeholder="9.99"
                value={settings.price || ''}
                onChange={(e) => setSettings({ ...settings, price: parseFloat(e.target.value) })}
                data-testid="input-price"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publishing Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Publishing Schedule</CardTitle>
          <CardDescription>
            Choose when to publish your content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              variant={settings.publishSchedule === 'now' ? 'default' : 'outline'}
              onClick={() => setSettings({ ...settings, publishSchedule: 'now' })}
              data-testid="button-publish-now"
            >
              Publish Now
            </Button>
            <Button
              variant={settings.publishSchedule === 'scheduled' ? 'default' : 'outline'}
              onClick={() => setSettings({ ...settings, publishSchedule: 'scheduled' })}
              data-testid="button-schedule"
            >
              <Clock className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          </div>

          {settings.publishSchedule === 'scheduled' && (
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !settings.scheduledDate && "text-muted-foreground"
                    )}
                    data-testid="button-pick-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {settings.scheduledDate ? format(settings.scheduledDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={settings.scheduledDate}
                    onSelect={(date) => setSettings({ ...settings, scheduledDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Input
                type="time"
                value={settings.scheduledTime || ''}
                onChange={(e) => setSettings({ ...settings, scheduledTime: e.target.value })}
                data-testid="input-time"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Tools</CardTitle>
          <CardDescription>
            Enhance your distribution with smart features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="qrCode" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Generate QR Code
            </Label>
            <Switch
              id="qrCode"
              checked={settings.generateQrCode}
              onCheckedChange={(checked) => setSettings({ ...settings, generateQrCode: checked })}
              data-testid="switch-qr-code"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="smartLink" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Generate Smart Link
            </Label>
            <Switch
              id="smartLink"
              checked={settings.generateSmartLink}
              onCheckedChange={(checked) => setSettings({ ...settings, generateSmartLink: checked })}
              data-testid="switch-smart-link"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="retargeting" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Auto Retargeting
            </Label>
            <Switch
              id="retargeting"
              checked={settings.autoRetargeting}
              onCheckedChange={(checked) => setSettings({ ...settings, autoRetargeting: checked })}
              data-testid="switch-retargeting"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="crossPromote" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Cross-Promote
            </Label>
            <Switch
              id="crossPromote"
              checked={settings.crossPromote}
              onCheckedChange={(checked) => setSettings({ ...settings, crossPromote: checked })}
              data-testid="switch-cross-promote"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notify" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Notify Followers
            </Label>
            <Switch
              id="notify"
              checked={settings.notifyFollowers}
              onCheckedChange={(checked) => setSettings({ ...settings, notifyFollowers: checked })}
              data-testid="switch-notify"
            />
          </div>
        </CardContent>
      </Card>

      {/* Distribute Button */}
      <Button
        onClick={() => distributeMutation.mutate()}
        disabled={distributeMutation.isPending || settings.platforms.length === 0}
        className="w-full"
        size="lg"
        data-testid="button-distribute"
      >
        {distributeMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Distributing...
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4 mr-2" />
            Distribute to {settings.platforms.length} Platform{settings.platforms.length !== 1 ? 's' : ''}
          </>
        )}
      </Button>
    </div>
  );
}