import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Heart,
  Sparkles,
  CreditCard,
  Shield,
  TrendingUp,
  MessageCircle,
  Gift,
  Calendar,
} from "lucide-react";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: "Welcome",
    description: "Discover Creators",
    icon: Sparkles,
  },
  {
    id: 2,
    title: "Account",
    description: "Create Account",
    icon: Heart,
  },
  {
    id: 3,
    title: "Personalize",
    description: "Find Your Vibe",
    icon: TrendingUp,
  },
  {
    id: 4,
    title: "Payment",
    description: "Quick Setup",
    icon: CreditCard,
  },
  {
    id: 5,
    title: "Dashboard",
    description: "Start Exploring",
    icon: MessageCircle,
  },
];

const interests = [
  { name: "Fitness", emoji: "💪" },
  { name: "Fashion", emoji: "👗" },
  { name: "Art", emoji: "🎨" },
  { name: "Gaming", emoji: "🎮" },
  { name: "Music", emoji: "🎵" },
  { name: "Beauty", emoji: "💄" },
  { name: "Lifestyle", emoji: "✨" },
  { name: "Food", emoji: "🍕" },
  { name: "Travel", emoji: "✈️" },
  { name: "Wellness", emoji: "🧘" },
];

export function FanzOnboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    birthday: "",
    selectedInterests: [] as string[],
    paymentAdded: false,
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/fan/onboarding", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Welcome to GirlFanz! 🎉",
        description: "Your personalized feed is ready. Start discovering!",
      });
      setLocation("/feed");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete onboarding",
        variant: "destructive",
      });
    },
  });

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedInterests: prev.selectedInterests.includes(interest)
        ? prev.selectedInterests.filter((i) => i !== interest)
        : [...prev.selectedInterests, interest],
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-gf-cyber to-gf-pink blur-xl opacity-50"></div>
                <Sparkles className="relative h-24 w-24 text-gf-pink" />
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gf-cyber to-gf-pink bg-clip-text text-transparent mb-4">
                Discover. Connect. Support.
              </h2>
              <p className="text-gf-steel text-lg max-w-xl mx-auto">
                Your new world of creators awaits. Find exclusive content, connect with
                your favorite stars, and support the creators you love.
              </p>
            </div>

            {/* Featured Creators Preview (Blurred) */}
            <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="relative h-32 bg-gradient-to-br from-gf-cyber/20 to-gf-pink/20 rounded-lg overflow-hidden"
                >
                  <div className="absolute inset-0 backdrop-blur-xl bg-black/40 flex items-center justify-center">
                    <p className="text-gf-snow text-xs font-semibold">Sign up to see</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <Card className="bg-gf-charcoal/50 border-gf-steel/20">
                <CardContent className="p-4 text-center">
                  <Heart className="h-8 w-8 text-gf-pink mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gf-snow">Follow Stars</p>
                  <p className="text-xs text-gf-steel mt-1">Your faves, your feed</p>
                </CardContent>
              </Card>
              <Card className="bg-gf-charcoal/50 border-gf-steel/20">
                <CardContent className="p-4 text-center">
                  <MessageCircle className="h-8 w-8 text-gf-cyber mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gf-snow">Direct Access</p>
                  <p className="text-xs text-gf-steel mt-1">Message creators</p>
                </CardContent>
              </Card>
              <Card className="bg-gf-charcoal/50 border-gf-steel/20">
                <CardContent className="p-4 text-center">
                  <Gift className="h-8 w-8 text-gf-pink mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gf-snow">Show Support</p>
                  <p className="text-xs text-gf-steel mt-1">Tips & subscriptions</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 max-w-lg mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gf-snow mb-2">Create Your Account</h2>
              <p className="text-gf-steel">Quick and easy sign up</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gf-snow mb-2 block">
                  Birthday (Age Verification)
                </label>
                <Input
                  type="date"
                  value={formData.birthday}
                  onChange={(e) =>
                    setFormData({ ...formData, birthday: e.target.value })
                  }
                  className="bg-gf-ink border-gf-steel/20"
                  data-testid="input-birthday"
                />
                <p className="text-xs text-gf-steel mt-1">
                  You must be 18+ to join GirlFanz
                </p>
              </div>

              <Card className="bg-gf-charcoal/30 border-gf-cyber/20">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-gf-snow mb-3">
                    Or sign up with
                  </p>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full border-gf-steel/20"
                      data-testid="button-google-signup"
                    >
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-gf-steel/20"
                      data-testid="button-apple-signup"
                    >
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                      Continue with Apple
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <p className="text-xs text-gf-steel">
                  By signing up, you agree to our{" "}
                  <a href="/terms" className="text-gf-cyber hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-gf-cyber hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <TrendingUp className="h-16 w-16 text-gf-cyber mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gf-snow mb-2">
                Personalize Your Feed
              </h2>
              <p className="text-gf-steel">
                Pick your interests to discover creators you&apos;ll love
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gf-snow mb-3 block">
                What are you interested in?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {interests.map((interest) => (
                  <Card
                    key={interest.name}
                    onClick={() => toggleInterest(interest.name)}
                    className={`cursor-pointer transition-all ${
                      formData.selectedInterests.includes(interest.name)
                        ? "bg-gradient-to-r from-gf-cyber to-gf-pink border-gf-cyber"
                        : "bg-gf-charcoal/30 border-gf-steel/20 hover:border-gf-cyber/50"
                    }`}
                    data-testid={`card-interest-${interest.name.toLowerCase()}`}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl mb-2">{interest.emoji}</div>
                      <p className="text-sm font-medium text-gf-snow">{interest.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {formData.selectedInterests.length > 0 && (
              <Card className="bg-gf-charcoal/30 border-gf-cyber/20">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-gf-snow mb-2">
                    Selected Interests ({formData.selectedInterests.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.selectedInterests.map((interest) => (
                      <Badge
                        key={interest}
                        className="bg-gradient-to-r from-gf-cyber to-gf-pink"
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 max-w-lg mx-auto">
            <div className="text-center mb-6">
              <CreditCard className="h-16 w-16 text-gf-cyber mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gf-snow mb-2">Payment Setup</h2>
              <p className="text-gf-steel">Optional - Add payment for instant tips & subs</p>
            </div>

            <Card className="bg-gf-charcoal/50 border-gf-steel/20">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-10 w-10 text-gf-cyber flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gf-snow">100% Secure Payments</p>
                    <p className="text-sm text-gf-steel">
                      Bank-level encryption. Your data is safe.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full border-gf-steel/20 justify-start"
                    data-testid="button-add-card"
                  >
                    <CreditCard className="h-5 w-5 mr-3" />
                    Add Credit/Debit Card
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full border-gf-steel/20 justify-start"
                    data-testid="button-add-paypal"
                  >
                    <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
                    </svg>
                    Add PayPal
                  </Button>
                </div>

                <div className="text-center pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep(5)}
                    className="text-gf-steel hover:text-gf-snow"
                    data-testid="button-skip-payment"
                  >
                    Skip for now
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="bg-gf-charcoal/30 rounded-lg p-4">
              <p className="text-xs text-gf-steel text-center">
                💡 Add payment now to tip creators instantly and unlock exclusive content
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <Heart className="h-24 w-24 text-gf-pink animate-pulse" />
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gf-cyber to-gf-pink bg-clip-text text-transparent mb-4">
                Welcome to the Community! 🎉
              </h2>
              <p className="text-gf-steel text-lg max-w-xl mx-auto">
                Your personalized feed is ready. Discover creators, engage with content,
                and be part of something special.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <Card className="bg-gf-charcoal/50 border-gf-steel/20">
                <CardContent className="p-6 text-center">
                  <Sparkles className="h-8 w-8 text-gf-cyber mx-auto mb-3" />
                  <p className="font-semibold text-gf-snow mb-2">Discover Feed</p>
                  <p className="text-sm text-gf-steel">
                    Personalized content just for you
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gf-charcoal/50 border-gf-steel/20">
                <CardContent className="p-6 text-center">
                  <MessageCircle className="h-8 w-8 text-gf-pink mx-auto mb-3" />
                  <p className="font-semibold text-gf-snow mb-2">Direct Messages</p>
                  <p className="text-sm text-gf-steel">Connect with your favorite stars</p>
                </CardContent>
              </Card>
              <Card className="bg-gf-charcoal/50 border-gf-steel/20">
                <CardContent className="p-6 text-center">
                  <Calendar className="h-8 w-8 text-gf-cyber mx-auto mb-3" />
                  <p className="font-semibold text-gf-snow mb-2">Live Events</p>
                  <p className="text-sm text-gf-steel">Join exclusive live streams</p>
                </CardContent>
              </Card>
            </div>

            <Button
              onClick={() => completeOnboardingMutation.mutate(formData)}
              disabled={completeOnboardingMutation.isPending}
              className="bg-gradient-to-r from-gf-cyber to-gf-pink hover:opacity-90 text-lg px-8 py-6"
              data-testid="button-complete-onboarding"
            >
              {completeOnboardingMutation.isPending ? (
                "Setting up..."
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Start Exploring
                </>
              )}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow p-6">
      <div className="max-w-6xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                      currentStep >= step.id
                        ? "bg-gradient-to-r from-gf-cyber to-gf-pink border-gf-pink"
                        : "bg-gf-charcoal border-gf-steel/20"
                    }`}
                  >
                    <step.icon className="h-6 w-6" />
                  </div>
                  <p
                    className={`text-xs mt-2 font-medium ${
                      currentStep >= step.id ? "text-gf-pink" : "text-gf-steel"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-all ${
                      currentStep > step.id ? "bg-gf-pink" : "bg-gf-steel/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">{renderStep()}</div>

        {/* Navigation */}
        {currentStep !== 5 && (
          <div className="flex justify-between max-w-2xl mx-auto">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="border-gf-steel/20"
              data-testid="button-previous"
            >
              Previous
            </Button>
            <Button
              onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
              className="bg-gradient-to-r from-gf-cyber to-gf-pink hover:opacity-90"
              data-testid="button-next"
            >
              {currentStep === 4 ? "Skip & Continue" : "Next"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
