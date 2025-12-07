import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  Camera, 
  Heart, 
  DollarSign, 
  Users, 
  Star,
  Sparkles,
  Wand2,
  Trophy,
  Target,
  Rocket,
  PartyPopper
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  component: React.ComponentType<any>;
}

interface CreatorProfile {
  displayName: string;
  bio: string;
  interests: string[];
  avatar?: string;
  coverImage?: string;
  location?: string;
  website?: string;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
  };
}

interface MonetizationSettings {
  subscriptionPrice: number;
  enableTips: boolean;
  enablePPV: boolean;
  averagePPVPrice: number;
  enableLiveStreaming: boolean;
  enableMerchandise: boolean;
}

interface ContentStrategy {
  contentTypes: string[];
  postingFrequency: string;
  audience: string;
  goals: string[];
}

// Step 1: Welcome & Profile Setup
function WelcomeStep({ data, onUpdate, onNext }: any) {
  const [profile, setProfile] = useState<CreatorProfile>(data.profile || {
    displayName: '',
    bio: '',
    interests: [],
    socialLinks: {}
  });

  const availableInterests = [
    'Fitness', 'Gaming', 'Music', 'Art', 'Fashion', 'Cooking', 'Travel',
    'Photography', 'Comedy', 'Education', 'Lifestyle', 'Beauty', 'Tech',
    'Sports', 'Dance', 'DIY', 'Pets', 'Books', 'Movies', 'Health'
  ];

  const handleInterestToggle = (interest: string) => {
    const newInterests = profile.interests.includes(interest)
      ? profile.interests.filter(i => i !== interest)
      : [...profile.interests, interest];
    
    setProfile({ ...profile, interests: newInterests });
  };

  const handleNext = () => {
    if (!profile.displayName.trim()) {
      return;
    }
    onUpdate({ profile });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Welcome to FansLab! ✨
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Let's create your amazing creator profile and get you ready to connect with your fans!
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Tell us about yourself
          </CardTitle>
          <CardDescription>
            This information will help fans discover and connect with you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                placeholder="Your creator name"
                value={profile.displayName}
                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                data-testid="input-display-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="City, Country"
                value={profile.location || ''}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                data-testid="input-location"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell your fans about yourself, your content, and what makes you unique..."
              rows={3}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              data-testid="textarea-bio"
            />
          </div>

          <div className="space-y-3">
            <Label>Your Interests & Content Topics</Label>
            <div className="flex flex-wrap gap-2">
              {availableInterests.map((interest) => (
                <Badge
                  key={interest}
                  variant={profile.interests.includes(interest) ? "default" : "outline"}
                  className="cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => handleInterestToggle(interest)}
                  data-testid={`badge-interest-${interest.toLowerCase()}`}
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleNext}
          disabled={!profile.displayName.trim()}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          data-testid="button-next-welcome"
        >
          Next Step <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 2: Monetization Setup
function MonetizationStep({ data, onUpdate, onNext, onPrev }: any) {
  const [settings, setSettings] = useState<MonetizationSettings>(data.monetization || {
    subscriptionPrice: 9.99,
    enableTips: true,
    enablePPV: true,
    averagePPVPrice: 4.99,
    enableLiveStreaming: false,
    enableMerchandise: false
  });

  const handleNext = () => {
    onUpdate({ monetization: settings });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mb-4">
          <DollarSign className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Monetization Magic 💰
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Set up your earning potential! You can always adjust these later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Subscription Model
            </CardTitle>
            <CardDescription>
              Monthly subscription for exclusive content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Monthly Subscription Price</Label>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">$5</span>
                <Slider
                  value={[settings.subscriptionPrice]}
                  onValueChange={([value]) => setSettings({ ...settings, subscriptionPrice: value })}
                  max={50}
                  min={5}
                  step={0.99}
                  className="flex-1"
                  data-testid="slider-subscription-price"
                />
                <span className="text-sm text-muted-foreground">$50</span>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-green-600">
                  ${settings.subscriptionPrice.toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Pay-Per-View Content
            </CardTitle>
            <CardDescription>
              Premium content with one-time purchases
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-ppv">Enable PPV Content</Label>
              <Switch
                id="enable-ppv"
                checked={settings.enablePPV}
                onCheckedChange={(checked) => setSettings({ ...settings, enablePPV: checked })}
                data-testid="switch-enable-ppv"
              />
            </div>
            
            {settings.enablePPV && (
              <div className="space-y-2">
                <Label>Average PPV Price</Label>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground">$1</span>
                  <Slider
                    value={[settings.averagePPVPrice]}
                    onValueChange={([value]) => setSettings({ ...settings, averagePPVPrice: value })}
                    max={25}
                    min={1}
                    step={0.99}
                    className="flex-1"
                    data-testid="slider-ppv-price"
                  />
                  <span className="text-sm text-muted-foreground">$25</span>
                </div>
                <div className="text-center">
                  <span className="text-xl font-bold text-yellow-600">
                    ${settings.averagePPVPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Tips & Support
            </CardTitle>
            <CardDescription>
              Let fans show appreciation with tips
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enable-tips">Enable Tips</Label>
                <p className="text-sm text-muted-foreground">
                  Fans can send you tips on posts and messages
                </p>
              </div>
              <Switch
                id="enable-tips"
                checked={settings.enableTips}
                onCheckedChange={(checked) => setSettings({ ...settings, enableTips: checked })}
                data-testid="switch-enable-tips"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-purple-500" />
              Advanced Features
            </CardTitle>
            <CardDescription>
              Additional monetization options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enable-live">Live Streaming</Label>
                <p className="text-sm text-muted-foreground">Host live streams for fans</p>
              </div>
              <Switch
                id="enable-live"
                checked={settings.enableLiveStreaming}
                onCheckedChange={(checked) => setSettings({ ...settings, enableLiveStreaming: checked })}
                data-testid="switch-enable-live"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enable-merch">Merchandise</Label>
                <p className="text-sm text-muted-foreground">Sell branded products</p>
              </div>
              <Switch
                id="enable-merch"
                checked={settings.enableMerchandise}
                onCheckedChange={(checked) => setSettings({ ...settings, enableMerchandise: checked })}
                data-testid="switch-enable-merch"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev} data-testid="button-prev-monetization">
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <Button 
          onClick={handleNext}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          data-testid="button-next-monetization"
        >
          Next Step <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 3: Content Strategy
function ContentStrategyStep({ data, onUpdate, onNext, onPrev }: any) {
  const [strategy, setStrategy] = useState<ContentStrategy>(data.contentStrategy || {
    contentTypes: [],
    postingFrequency: '',
    audience: '',
    goals: []
  });

  const contentTypes = [
    'Photos', 'Videos', 'Live Streams', 'Audio/Podcasts', 'Text Posts',
    'Stories', 'Polls', 'Q&A Sessions', 'Behind the Scenes', 'Tutorials'
  ];

  const audienceTypes = [
    'General Adult Audience', 'Fitness Enthusiasts', 'Art Lovers', 
    'Gamers', 'Music Fans', 'Fashion Forward', 'Lifestyle Seekers'
  ];

  const goalOptions = [
    'Build a loyal fanbase', 'Earn consistent income', 'Share my passion',
    'Connect with like-minded people', 'Grow my personal brand', 'Have fun creating'
  ];

  const handleContentTypeToggle = (type: string) => {
    const newTypes = strategy.contentTypes.includes(type)
      ? strategy.contentTypes.filter(t => t !== type)
      : [...strategy.contentTypes, type];
    
    setStrategy({ ...strategy, contentTypes: newTypes });
  };

  const handleGoalToggle = (goal: string) => {
    const newGoals = strategy.goals.includes(goal)
      ? strategy.goals.filter(g => g !== goal)
      : [...strategy.goals, goal];
    
    setStrategy({ ...strategy, goals: newGoals });
  };

  const handleNext = () => {
    onUpdate({ contentStrategy: strategy });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full mb-4">
          <Target className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Content Strategy 🎯
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Let's plan your content approach to maximize engagement and growth!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-500" />
              Content Types
            </CardTitle>
            <CardDescription>
              What type of content will you create?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {contentTypes.map((type) => (
                <Badge
                  key={type}
                  variant={strategy.contentTypes.includes(type) ? "default" : "outline"}
                  className="cursor-pointer hover:scale-105 transition-transform p-2 justify-center"
                  onClick={() => handleContentTypeToggle(type)}
                  data-testid={`badge-content-type-${type.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              Target Audience
            </CardTitle>
            <CardDescription>
              Who are you creating content for?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={strategy.audience} onValueChange={(value) => setStrategy({ ...strategy, audience: value })}>
              <SelectTrigger data-testid="select-audience">
                <SelectValue placeholder="Select your target audience" />
              </SelectTrigger>
              <SelectContent>
                {audienceTypes.map((audience) => (
                  <SelectItem key={audience} value={audience} data-testid={`select-item-${audience.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                    {audience}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-purple-500" />
              Posting Frequency
            </CardTitle>
            <CardDescription>
              How often do you plan to post?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={strategy.postingFrequency} onValueChange={(value) => setStrategy({ ...strategy, postingFrequency: value })}>
              <SelectTrigger data-testid="select-frequency">
                <SelectValue placeholder="Select posting frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily" data-testid="select-item-daily">Daily (High engagement)</SelectItem>
                <SelectItem value="few-times-week" data-testid="select-item-few-times-week">Few times a week</SelectItem>
                <SelectItem value="weekly" data-testid="select-item-weekly">Weekly</SelectItem>
                <SelectItem value="bi-weekly" data-testid="select-item-bi-weekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly" data-testid="select-item-monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Your Goals
            </CardTitle>
            <CardDescription>
              What do you hope to achieve?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {goalOptions.map((goal) => (
                <Badge
                  key={goal}
                  variant={strategy.goals.includes(goal) ? "default" : "outline"}
                  className="cursor-pointer hover:scale-105 transition-transform w-full justify-center p-2"
                  onClick={() => handleGoalToggle(goal)}
                  data-testid={`badge-goal-${goal.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                >
                  {goal}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev} data-testid="button-prev-strategy">
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <Button 
          onClick={handleNext}
          disabled={strategy.contentTypes.length === 0 || !strategy.audience || !strategy.postingFrequency}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
          data-testid="button-next-strategy"
        >
          Complete Setup <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 4: Completion & Launch
function CompletionStep({ data, onComplete }: any) {
  const { toast } = useToast();
  
  const completeMutation = useMutation({
    mutationFn: async (onboardingData: any) => {
      const response = await apiRequest('POST', '/api/onboarding/complete', onboardingData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Welcome to FansLab! 🎉",
        description: "Your creator profile has been set up successfully!",
      });
      onComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Setup Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLaunch = () => {
    completeMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mb-4">
          <PartyPopper className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          You're All Set! 🚀
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto text-lg">
          Congratulations! Your creator profile is ready. Let's review your setup and launch your journey!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-purple-200">
          <CardHeader className="text-center">
            <Heart className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <CardTitle>Profile Ready</CardTitle>
            <CardDescription>
              {data.profile?.displayName || 'Your profile'} is set up with {data.profile?.interests?.length || 0} interests
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-2 border-green-200">
          <CardHeader className="text-center">
            <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <CardTitle>Monetization</CardTitle>
            <CardDescription>
              ${data.monetization?.subscriptionPrice?.toFixed(2) || '0.00'}/month subscription
              {data.monetization?.enableTips && ' + Tips'}
              {data.monetization?.enablePPV && ' + PPV'}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-2 border-blue-200">
          <CardHeader className="text-center">
            <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <CardTitle>Content Strategy</CardTitle>
            <CardDescription>
              {data.contentStrategy?.contentTypes?.length || 0} content types, 
              {data.contentStrategy?.postingFrequency && ` ${data.contentStrategy.postingFrequency} posting`}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-purple-500" />
            Ready to Launch?
          </CardTitle>
          <CardDescription>
            Your profile will be activated and you can start connecting with fans immediately!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">What happens next:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>✅ Profile goes live</li>
                <li>✅ Monetization features enabled</li>
                <li>✅ Discovery algorithms activated</li>
                <li>✅ Analytics tracking begins</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Pro tips for success:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>💡 Post consistently</li>
                <li>💡 Engage with your fans</li>
                <li>💡 Use relevant hashtags</li>
                <li>💡 Check your analytics</li>
              </ul>
            </div>
          </div>

          <Button 
            onClick={handleLaunch}
            disabled={completeMutation.isPending}
            size="lg"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3"
            data-testid="button-launch-profile"
          >
            {completeMutation.isPending ? (
              "Launching your profile..."
            ) : (
              <>
                <Rocket className="mr-2 h-5 w-5" />
                Launch My Creator Profile! 🚀
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OnboardingPage() {
  const [location, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({});

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome & Profile',
      description: 'Set up your creator identity',
      icon: Heart,
      component: WelcomeStep
    },
    {
      id: 'monetization',
      title: 'Monetization',
      description: 'Configure your earnings',
      icon: DollarSign,
      component: MonetizationStep
    },
    {
      id: 'strategy',
      title: 'Content Strategy',
      description: 'Plan your content approach',
      icon: Target,
      component: ContentStrategyStep
    },
    {
      id: 'completion',
      title: 'Launch',
      description: 'Complete your setup',
      icon: Rocket,
      component: CompletionStep
    }
  ];

  const currentStepData = steps[currentStep];
  const StepComponent = currentStepData.component;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleStepUpdate = (data: any) => {
    setOnboardingData({ ...onboardingData, ...data });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Creator Onboarding</h1>
            <Badge variant="outline" className="text-sm">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>
          
          <Progress value={progress} className="mb-6" data-testid="progress-onboarding" />
          
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div 
                  key={step.id} 
                  className={`flex flex-col items-center space-y-2 ${
                    isActive ? 'text-purple-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}
                  data-testid={`step-indicator-${step.id}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive 
                      ? 'bg-purple-100 text-purple-600' 
                      : isCompleted 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs text-muted-foreground hidden md:block">
                      {step.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          <StepComponent
            data={onboardingData}
            onUpdate={handleStepUpdate}
            onNext={handleNext}
            onPrev={handlePrev}
            onComplete={handleComplete}
          />
        </div>
      </div>
    </div>
  );
}