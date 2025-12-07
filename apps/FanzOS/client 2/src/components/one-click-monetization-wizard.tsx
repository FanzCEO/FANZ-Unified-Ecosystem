import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, Users, Heart, Star, Zap, Target, 
  CreditCard, Wallet, Gift, TrendingUp, CheckCircle,
  ArrowRight, ArrowLeft, Sparkles, Crown, Camera,
  MessageCircle, Video, Image, Calendar, Clock
} from 'lucide-react';

interface MonetizationStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  progress: number;
}

interface MonetizationSettings {
  subscriptionPrice: number;
  ppvEnabled: boolean;
  tipsEnabled: boolean;
  merchandiseEnabled: boolean;
  liveStreamEnabled: boolean;
  customRequestsEnabled: boolean;
  autoPostScheduling: boolean;
  fanClubTiers: boolean;
}

interface RevenueStream {
  id: string;
  name: string;
  description: string;
  icon: any;
  enabled: boolean;
  estimatedRevenue: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timeToSetup: string;
  requirements: string[];
}

export function OneClickMonetizationWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [settings, setSettings] = useState<MonetizationSettings>({
    subscriptionPrice: 9.99,
    ppvEnabled: true,
    tipsEnabled: true,
    merchandiseEnabled: false,
    liveStreamEnabled: false,
    customRequestsEnabled: true,
    autoPostScheduling: true,
    fanClubTiers: false
  });
  const [isWizardComplete, setIsWizardComplete] = useState(false);
  const [estimatedMonthlyRevenue, setEstimatedMonthlyRevenue] = useState(0);

  const steps: MonetizationStep[] = [
    {
      id: 'profile-setup',
      title: 'Profile Optimization',
      description: 'Optimize your creator profile for maximum appeal',
      completed: false,
      progress: 0
    },
    {
      id: 'revenue-streams',
      title: 'Revenue Streams',
      description: 'Select your monetization methods',
      completed: false,
      progress: 0
    },
    {
      id: 'pricing-strategy',
      title: 'Pricing Strategy',
      description: 'Set competitive prices for your content',
      completed: false,
      progress: 0
    },
    {
      id: 'content-calendar',
      title: 'Content Planning',
      description: 'Plan your content schedule for consistency',
      completed: false,
      progress: 0
    },
    {
      id: 'launch-strategy',
      title: 'Launch Strategy',
      description: 'Execute your monetization launch',
      completed: false,
      progress: 0
    }
  ];

  const revenueStreams: RevenueStream[] = [
    {
      id: 'subscriptions',
      name: 'Monthly Subscriptions',
      description: 'Recurring income from devoted fans',
      icon: Crown,
      enabled: true,
      estimatedRevenue: 800,
      difficulty: 'easy',
      timeToSetup: '5 minutes',
      requirements: ['Profile setup', 'Payment method']
    },
    {
      id: 'ppv',
      name: 'Pay-Per-View Content',
      description: 'Premium content sold individually',
      icon: Image,
      enabled: settings.ppvEnabled,
      estimatedRevenue: 450,
      difficulty: 'easy',
      timeToSetup: '2 minutes',
      requirements: ['Content ready']
    },
    {
      id: 'tips',
      name: 'Tips & Donations',
      description: 'Direct support from appreciative fans',
      icon: Gift,
      enabled: settings.tipsEnabled,
      estimatedRevenue: 320,
      difficulty: 'easy',
      timeToSetup: '1 minute',
      requirements: ['Active engagement']
    },
    {
      id: 'live-streams',
      name: 'Live Streaming',
      description: 'Real-time interactions with premium features',
      icon: Video,
      enabled: settings.liveStreamEnabled,
      estimatedRevenue: 600,
      difficulty: 'medium',
      timeToSetup: '15 minutes',
      requirements: ['Webcam', 'Stable internet', 'Schedule']
    },
    {
      id: 'custom-requests',
      name: 'Custom Requests',
      description: 'Personalized content for higher rates',
      icon: Star,
      enabled: settings.customRequestsEnabled,
      estimatedRevenue: 280,
      difficulty: 'medium',
      timeToSetup: '10 minutes',
      requirements: ['Clear pricing', 'Terms of service']
    },
    {
      id: 'merchandise',
      name: 'Branded Merchandise',
      description: 'Physical products with your brand',
      icon: Heart,
      enabled: settings.merchandiseEnabled,
      estimatedRevenue: 180,
      difficulty: 'hard',
      timeToSetup: '2-3 days',
      requirements: ['Product designs', 'Supplier setup']
    }
  ];

  // Calculate estimated revenue based on enabled streams
  useEffect(() => {
    const totalRevenue = revenueStreams
      .filter(stream => stream.enabled)
      .reduce((sum, stream) => sum + stream.estimatedRevenue, 0);
    setEstimatedMonthlyRevenue(totalRevenue);
  }, [settings]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500 bg-green-100 dark:bg-green-900/20';
      case 'medium': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20';
      case 'hard': return 'text-red-500 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const handleStepCompletion = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsWizardComplete(true);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    
    switch (step.id) {
      case 'profile-setup':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                ✨
              </motion.div>
              <h2 className="text-2xl font-bold">Let's Perfect Your Creator Profile</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                An optimized profile can increase your earnings by up to 300%
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label htmlFor="bio">Bio & Description</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell fans what makes you special..."
                  className="min-h-24"
                  data-testid="input-bio"
                />
                <div className="text-sm text-gray-500">
                  ✓ Include your interests and personality
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="profile-image">Profile & Banner Images</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera size={48} className="mx-auto mb-2 text-gray-400" />
                  <Button variant="outline" data-testid="button-upload-profile">
                    Upload High-Quality Photos
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Professional photos increase subscription rates by 85%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Quick Wins:</h4>
              <ul className="text-sm space-y-1 text-green-600 dark:text-green-300">
                <li>• Use your real first name or consistent stage name</li>
                <li>• Add 3-5 interests/hobbies fans can connect with</li>
                <li>• Include posting schedule ("New content daily!")</li>
                <li>• Mention subscriber perks</li>
              </ul>
            </div>
          </div>
        );

      case 'revenue-streams':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="text-6xl mb-4"
              >
                💰
              </motion.div>
              <h2 className="text-2xl font-bold">Choose Your Revenue Streams</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Diversify your income with multiple monetization methods
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {revenueStreams.map((stream) => {
                const Icon = stream.icon;
                return (
                  <motion.div
                    key={stream.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all ${
                        stream.enabled 
                          ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => {
                        const key = stream.id as keyof MonetizationSettings;
                        if (key in settings) {
                          setSettings(prev => ({ ...prev, [key]: !prev[key] }));
                        }
                      }}
                      data-testid={`revenue-stream-${stream.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white">
                              <Icon size={20} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">{stream.name}</h3>
                              <p className="text-xs text-gray-500">{stream.description}</p>
                            </div>
                          </div>
                          {stream.enabled && <CheckCircle size={20} className="text-green-500" />}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Est. Monthly</span>
                            <span className="font-bold text-green-600">${stream.estimatedRevenue}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Setup Time</span>
                            <span className="text-sm">{stream.timeToSetup}</span>
                          </div>
                          <Badge className={`text-xs ${getDifficultyColor(stream.difficulty)}`}>
                            {stream.difficulty}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Revenue Projection */}
            <Card className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-bold mb-2">Projected Monthly Revenue</h3>
                <div className="text-4xl font-bold mb-2">
                  ${estimatedMonthlyRevenue.toLocaleString()}
                </div>
                <p className="text-green-100">
                  Based on industry averages for your selected streams
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case 'pricing-strategy':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                🎯
              </motion.div>
              <h2 className="text-2xl font-bold">Set Your Pricing Strategy</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Smart pricing maximizes both subscribers and revenue
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Subscription Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown size={20} className="text-yellow-500" />
                    Subscription Price
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="sub-price">Monthly Price ($)</Label>
                    <Input
                      id="sub-price"
                      type="number"
                      value={settings.subscriptionPrice}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        subscriptionPrice: parseFloat(e.target.value) || 0 
                      }))}
                      step="0.01"
                      min="0"
                      data-testid="input-subscription-price"
                    />
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
                    <h4 className="font-semibold mb-2">Pricing Recommendations:</h4>
                    <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                      <li>• $4.99-$9.99: Good for starting out</li>
                      <li>• $9.99-$19.99: Established creators</li>
                      <li>• $19.99+: Premium/exclusive content</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* PPV Strategy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image size={20} className="text-purple-500" />
                    PPV Content Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Photos (5-10 pics)</span>
                      <span className="font-semibold">$3-8</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Short Videos (1-5 min)</span>
                      <span className="font-semibold">$8-15</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Long Videos (5+ min)</span>
                      <span className="font-semibold">$15-30</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Custom Content</span>
                      <span className="font-semibold">$20-50+</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Prices auto-adjust based on your subscriber tier
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Pricing Features */}
            <Card>
              <CardHeader>
                <CardTitle>Advanced Pricing Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Fan Club Tiers</h4>
                      <p className="text-sm text-gray-500">Multiple subscription levels</p>
                    </div>
                    <Switch
                      checked={settings.fanClubTiers}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, fanClubTiers: checked }))}
                      data-testid="switch-fan-tiers"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Auto Post Scheduling</h4>
                      <p className="text-sm text-gray-500">Maximize engagement timing</p>
                    </div>
                    <Switch
                      checked={settings.autoPostScheduling}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoPostScheduling: checked }))}
                      data-testid="switch-auto-schedule"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'content-calendar':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                📅
              </motion.div>
              <h2 className="text-2xl font-bold">Plan Your Content Calendar</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Consistency is key to growing your fanbase and income
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Content Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { day: 'Monday', content: 'Free Teaser Post', time: '8:00 PM' },
                    { day: 'Tuesday', content: 'PPV Photo Set', time: '9:00 PM' },
                    { day: 'Wednesday', content: 'Fan Interaction', time: '7:30 PM' },
                    { day: 'Thursday', content: 'PPV Video', time: '8:30 PM' },
                    { day: 'Friday', content: 'Weekend Preview', time: '6:00 PM' },
                    { day: 'Saturday', content: 'Live Stream', time: '9:00 PM' },
                    { day: 'Sunday', content: 'Behind the Scenes', time: '7:00 PM' }
                  ].map((schedule) => (
                    <div key={schedule.day} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <h4 className="font-medium">{schedule.day}</h4>
                        <p className="text-sm text-gray-500">{schedule.content}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock size={16} />
                        {schedule.time}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Content Ideas */}
              <Card>
                <CardHeader>
                  <CardTitle>Content Ideas Generator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { type: 'Daily Life', idea: 'Morning routine video', engagement: 'High' },
                      { type: 'Interactive', idea: 'Q&A with subscribers', engagement: 'Very High' },
                      { type: 'Behind Scenes', idea: 'Photo shoot setup', engagement: 'Medium' },
                      { type: 'Educational', idea: 'Makeup/fitness tutorial', engagement: 'High' },
                      { type: 'Personal', idea: 'Day in my life vlog', engagement: 'Very High' }
                    ].map((content, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        data-testid={`content-idea-${index}`}
                      >
                        <div>
                          <h4 className="font-medium text-sm">{content.idea}</h4>
                          <p className="text-xs text-gray-500">{content.type}</p>
                        </div>
                        <Badge variant={content.engagement === 'Very High' ? 'default' : 'secondary'}>
                          {content.engagement}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    data-testid="button-generate-ideas"
                  >
                    <Sparkles size={16} className="mr-2" />
                    Generate More Ideas
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'launch-strategy':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                🚀
              </motion.div>
              <h2 className="text-2xl font-bold">Ready to Launch!</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Execute your monetization strategy with confidence
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Launch Checklist */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Pre-Launch Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { task: 'Profile optimized with bio and photos', completed: true },
                    { task: 'Subscription price set', completed: true },
                    { task: 'Revenue streams activated', completed: true },
                    { task: 'Content calendar planned', completed: true },
                    { task: 'Welcome message prepared', completed: false },
                    { task: 'First week content ready', completed: false },
                    { task: 'Payment methods verified', completed: false }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-2">
                      <CheckCircle 
                        size={20} 
                        className={item.completed ? 'text-green-500' : 'text-gray-300'}
                      />
                      <span className={item.completed ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'}>
                        {item.task}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Launch Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Your Setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      ${estimatedMonthlyRevenue}
                    </div>
                    <div className="text-sm text-gray-500">Est. Monthly Revenue</div>
                  </div>
                  
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {revenueStreams.filter(s => s.enabled).length}
                    </div>
                    <div className="text-sm text-gray-500">Revenue Streams</div>
                  </div>
                  
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      ${settings.subscriptionPrice}
                    </div>
                    <div className="text-sm text-gray-500">Subscription Price</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Final Launch Button */}
            <Card className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
              <CardContent className="p-8 text-center">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="text-4xl mb-4 inline-block"
                >
                  ✨
                </motion.div>
                <h3 className="text-xl font-bold mb-2">You're All Set!</h3>
                <p className="text-green-100 mb-6">
                  Your monetization setup is complete. Launch now to start earning!
                </p>
                <Button 
                  size="lg" 
                  className="bg-white text-green-600 hover:bg-gray-100"
                  onClick={() => setIsWizardComplete(true)}
                  data-testid="button-launch-monetization"
                >
                  <Zap size={20} className="mr-2" />
                  Launch My Monetization!
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (isWizardComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto p-6"
        data-testid="monetization-success"
      >
        <Card className="text-center bg-gradient-to-r from-green-500 to-blue-500 text-white">
          <CardContent className="p-12">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-8xl mb-6"
            >
              🎉
            </motion.div>
            <h1 className="text-4xl font-bold mb-4">Congratulations!</h1>
            <p className="text-xl text-green-100 mb-8">
              Your monetization strategy is now live and ready to generate income!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">${estimatedMonthlyRevenue}</div>
                <div className="text-sm text-green-100">Monthly Potential</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">{revenueStreams.filter(s => s.enabled).length}</div>
                <div className="text-sm text-green-100">Active Streams</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">5 min</div>
                <div className="text-sm text-green-100">Setup Time</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100"
                data-testid="button-view-dashboard"
              >
                View Analytics Dashboard
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10"
                data-testid="button-create-first-post"
              >
                Create Your First Post
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6" data-testid="monetization-wizard">
      {/* Progress Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">One-Click Monetization Wizard</h1>
            <Badge variant="secondary">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>
          
          <Progress 
            value={((currentStep + 1) / steps.length) * 100} 
            className="h-2 mb-4"
            data-testid="progress-wizard"
          />
          
          <div className="flex justify-between text-sm">
            {steps.map((step, index) => (
              <div 
                key={step.id} 
                className={`text-center ${
                  index <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'
                }`}
              >
                {step.title}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="p-8">
              {renderStepContent()}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousStep}
          disabled={currentStep === 0}
          data-testid="button-previous-step"
        >
          <ArrowLeft size={16} className="mr-2" />
          Previous
        </Button>
        
        <Button
          onClick={handleStepCompletion}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          data-testid="button-next-step"
        >
          {currentStep === steps.length - 1 ? 'Complete Setup' : 'Continue'}
          <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}