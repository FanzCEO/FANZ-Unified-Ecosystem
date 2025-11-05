import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { 
  Camera, Upload, Radio, Film, Settings, 
  TrendingUp, DollarSign, Eye, Heart, Share2,
  CheckCircle, Clock, AlertCircle, Sparkles, Shield
} from 'lucide-react';
import CameraCapture from '@/components/creator/CameraCapture';
import ContentUpload from '@/components/creator/ContentUpload';
import EditingPreview from '@/components/creator/EditingPreview';
import DistributionSettings from '@/components/creator/DistributionSettings';
import ContentAnalytics from '@/components/creator/ContentAnalytics';
import VerificationModal from '@/components/verification/VerificationModal';
import VerificationBadge from '@/components/verification/VerificationBadge';
import VerificationStatus from '@/components/verification/VerificationStatus';

type ContentSession = {
  id: string;
  title: string;
  description?: string;
  type: 'photo' | 'video' | 'livestream';
  sourceType: 'upload' | 'camera' | 'livestream';
  originalUrl: string;
  status: 'processing' | 'ready' | 'distributed' | 'failed';
  createdAt: string;
  editingTask?: {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
  };
  analytics?: {
    views: number;
    likes: number;
    shares: number;
    revenue: number;
  };
};

type StudioSettings = {
  autoEditingEnabled: boolean;
  autoDistributionEnabled: boolean;
  preferredPlatforms: string[];
  defaultHashtags: string[];
  aiPricingSuggestions: boolean;
};

export default function CreatorStudio() {
  const [activeTab, setActiveTab] = useState('create');
  const [selectedSession, setSelectedSession] = useState<ContentSession | null>(null);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const { toast } = useToast();

  // Check verification status
  const { data: profile } = useQuery({
    queryKey: ['/api/user/profile'],
  });

  // Get verification status
  const { data: verificationStatus } = useQuery({
    queryKey: ['/api/verification/status'],
  });

  // Get studio settings
  const { data: settings, isLoading: settingsLoading } = useQuery<StudioSettings>({
    queryKey: ['/api/creator/studio/settings'],
  });

  // Get content sessions
  const { data: sessions = [], isLoading: sessionsLoading, refetch: refetchSessions } = useQuery<ContentSession[]>({
    queryKey: ['/api/creator/content/sessions'],
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: Partial<StudioSettings>) =>
      apiRequest('/api/creator/studio/settings', {
        method: 'POST',
        body: newSettings,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/creator/studio/settings'] });
      toast({
        title: 'Settings updated',
        description: 'Your studio preferences have been saved.',
      });
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) =>
      apiRequest(`/api/creator/content/sessions/${sessionId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      refetchSessions();
      toast({
        title: 'Content deleted',
        description: 'The content session has been removed.',
      });
    },
  });

  // Check if user is verified
  useEffect(() => {
    if (verificationStatus && !verificationStatus.verified) {
      setShowVerificationAlert(true);
    } else if (verificationStatus?.verified) {
      setShowVerificationAlert(false);
    }
  }, [verificationStatus]);

  // Handle verification success
  const handleVerificationSuccess = () => {
    setShowVerificationModal(false);
    setShowVerificationAlert(false);
    queryClient.invalidateQueries({ queryKey: ['/api/verification/status'] });
    queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
    toast({
      title: 'Verification Complete!',
      description: 'You can now access all creator features.',
    });
  };

  const handleContentCreated = (session: ContentSession) => {
    setSelectedSession(session);
    refetchSessions();
    
    if (settings?.autoEditingEnabled) {
      // Automatically start processing
      processContent(session.id);
    }
    
    toast({
      title: 'Content uploaded successfully',
      description: settings?.autoEditingEnabled 
        ? 'AI processing has started automatically.'
        : 'Your content is ready for editing.',
    });
  };

  const processContent = async (sessionId: string) => {
    try {
      await apiRequest(`/api/creator/content/process/${sessionId}`, {
        method: 'POST',
        body: {
          editingOptions: {
            autoCut: true,
            addBranding: true,
            generateMultipleAspectRatios: true,
            createTrailer: true,
            createGif: true,
          },
        },
      });
      refetchSessions();
    } catch (error) {
      console.error('Failed to process content:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 animate-spin" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'distributed':
        return <Share2 className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getSessionStats = () => {
    const totalViews = sessions.reduce((acc, s) => acc + (s.analytics?.views || 0), 0);
    const totalRevenue = sessions.reduce((acc, s) => acc + (s.analytics?.revenue || 0), 0);
    const activeCount = sessions.filter(s => s.status === 'distributed').length;

    return { totalViews, totalRevenue, activeCount };
  };

  const stats = getSessionStats();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="title-creator-studio">Creator Studio</h1>
          <p className="text-muted-foreground">Create, edit, and distribute your content with AI automation</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setActiveTab('analytics')}
            data-testid="button-analytics"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveTab('settings')}
            data-testid="button-settings"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {showVerificationAlert && !verificationStatus?.verified && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription data-testid="alert-verification">
            <div className="flex items-center justify-between">
              <div>
                <strong>Verification Required:</strong> Complete your ID verification to unlock all creator features.
                <p className="text-sm mt-1">Verification ensures compliance with 18 U.S.C. §2257 requirements.</p>
              </div>
              <Button 
                size="sm" 
                onClick={() => setShowVerificationModal(true)}
                data-testid="button-verify-now"
              >
                <Shield className="h-4 w-4 mr-2" />
                Verify Now
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {verificationStatus?.verified && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Identity Verified</span>
          <VerificationBadge showText />
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-active-content">{stats.activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-views">
              {stats.totalViews.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-revenue">
              ${(stats.totalRevenue / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Auto Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {settings?.autoEditingEnabled && settings?.autoDistributionEnabled ? (
                <>
                  <Sparkles className="h-5 w-5 text-green-500" />
                  <span className="text-green-500 font-medium" data-testid="status-auto-mode">Full Auto</span>
                </>
              ) : (
                <>
                  <Settings className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-500" data-testid="status-manual-mode">Manual</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="create" data-testid="tab-create">Create</TabsTrigger>
          <TabsTrigger value="content" data-testid="tab-content">Content</TabsTrigger>
          <TabsTrigger value="edit" data-testid="tab-edit">Edit</TabsTrigger>
          <TabsTrigger value="distribute" data-testid="tab-distribute">Distribute</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Film with Camera
                </CardTitle>
                <CardDescription>
                  Use built-in camera with filters and effects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CameraCapture onCapture={handleContentCreated} />
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Content
                </CardTitle>
                <CardDescription>
                  Drag and drop or select files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContentUpload onUpload={handleContentCreated} />
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5" />
                  Go Live
                </CardTitle>
                <CardDescription>
                  Start a live stream with co-stars
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => toast({ title: 'Live streaming coming soon!' })}
                  data-testid="button-go-live"
                >
                  <Radio className="h-4 w-4 mr-2" />
                  Start Live Stream
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Content Sessions</CardTitle>
              <CardDescription>Manage your uploaded and created content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessionsLoading ? (
                  <p>Loading sessions...</p>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Film className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No content yet. Start creating!</p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <Card key={session.id} data-testid={`card-session-${session.id}`}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{session.title}</h3>
                            <Badge variant="outline">{session.type}</Badge>
                            {getStatusIcon(session.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Created {new Date(session.createdAt).toLocaleDateString()}
                          </p>
                          {session.analytics && (
                            <div className="flex gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {session.analytics.views}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {session.analytics.likes}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${(session.analytics.revenue / 100).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedSession(session)}
                            disabled={session.status === 'processing'}
                            data-testid={`button-view-${session.id}`}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteSessionMutation.mutate(session.id)}
                            data-testid={`button-delete-${session.id}`}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit">
          {selectedSession ? (
            <EditingPreview session={selectedSession} />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Select content to edit</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="distribute">
          {selectedSession ? (
            <DistributionSettings 
              sessionId={selectedSession.id} 
              onDistribute={() => refetchSessions()}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Share2 className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Select content to distribute</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <ContentAnalytics sessions={sessions} />
        </TabsContent>
      </Tabs>

      {/* Verification Modal */}
      <VerificationModal
        open={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onSuccess={handleVerificationSuccess}
        mandatory={false}
        userType="creator"
      />
    </div>
  );
}