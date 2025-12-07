import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Star,
  Upload,
  CheckCircle,
  CreditCard,
  Sparkles,
  Camera,
  DollarSign,
  Shield,
  TrendingUp,
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
    description: "Claim Your Star Power",
    icon: Star,
  },
  {
    id: 2,
    title: "Policies",
    description: "Compliance & Guidelines",
    icon: Shield,
  },
  {
    id: 3,
    title: "Profile",
    description: "Build Your Brand",
    icon: Sparkles,
  },
  {
    id: 4,
    title: "Verification",
    description: "Secure & Verify",
    icon: Shield,
  },
  {
    id: 5,
    title: "Monetization",
    description: "Set Up Earnings",
    icon: DollarSign,
  },
  {
    id: 6,
    title: "Dashboard",
    description: "Start Creating",
    icon: TrendingUp,
  },
];

const niches = [
  "Fitness & Wellness",
  "Fashion & Style",
  "Art & Photography",
  "Gaming",
  "Music",
  "Beauty & Makeup",
  "Lifestyle",
  "Education",
  "Food & Cooking",
  "Travel",
];

export function CreatorOnboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    displayName: "",
    stageName: "",
    pronouns: "",
    bio: "",
    selectedNiches: [] as string[],
    payoutMethod: "paypal",
    payoutEmail: "",
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/creator/onboarding", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Welcome to GirlFanz! 🌟",
        description: "Your creator profile is ready. Let's create!",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete onboarding",
        variant: "destructive",
      });
    },
  });

  const toggleNiche = (niche: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedNiches: prev.selectedNiches.includes(niche)
        ? prev.selectedNiches.filter((n) => n !== niche)
        : [...prev.selectedNiches, niche],
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
                <Star className="relative h-24 w-24 text-gf-cyber" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gf-cyber to-gf-pink bg-clip-text text-transparent mb-4">
                Claim Your Star Power
              </h2>
              <p className="text-gf-steel text-base sm:text-lg max-w-xl mx-auto px-4">
                Join thousands of creators earning 100% of their revenue. You own your content.
                You control your earnings. Welcome to true creative freedom.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto px-4">
              <Card className="bg-gf-charcoal/50 border-gf-steel/20">
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-8 w-8 text-gf-cyber mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gf-snow">100% Earnings</p>
                  <p className="text-xs text-gf-steel mt-1">Keep every penny</p>
                </CardContent>
              </Card>
              <Card className="bg-gf-charcoal/50 border-gf-steel/20">
                <CardContent className="p-4 text-center">
                  <Shield className="h-8 w-8 text-gf-pink mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gf-snow">Content Ownership</p>
                  <p className="text-xs text-gf-steel mt-1">You own it all</p>
                </CardContent>
              </Card>
              <Card className="bg-gf-charcoal/50 border-gf-steel/20">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-gf-cyber mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gf-snow">Community Tools</p>
                  <p className="text-xs text-gf-steel mt-1">Grow your fanz</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 max-w-2xl mx-auto px-4">
            <div className="text-center mb-6">
              <Shield className="h-12 w-12 sm:h-16 sm:w-16 text-gf-cyber mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gf-snow mb-2">Content Policies & Compliance</h2>
              <p className="text-sm sm:text-base text-gf-steel">Understand platform guidelines for adult content creators</p>
            </div>

            <Card className="bg-gf-charcoal/50 border-gf-steel/20">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-gf-snow mb-2">18 U.S.C. §2257 Compliance</h3>
                  <p className="text-sm text-gf-steel">
                    As an adult content creator, you must maintain records proving all performers are 18+. We handle compliance documentation for you.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gf-snow mb-2">Content Guidelines</h3>
                  <ul className="text-sm text-gf-steel space-y-2">
                    <li>✓ All content must follow community standards</li>
                    <li>✓ Prohibited: minors, non-consensual content, illegal activities</li>
                    <li>✓ Use content warnings for sensitive material</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gf-snow mb-2">Your Rights</h3>
                  <p className="text-sm text-gf-steel">
                    You retain 100% ownership of your content. You can remove it anytime. We protect your intellectual property.
                  </p>
                </div>

                <label className="flex items-start gap-3 p-4 bg-gf-ink rounded-lg">
                  <input
                    type="checkbox"
                    className="mt-1 w-5 h-5 rounded border-gf-steel/20 bg-gf-charcoal focus:ring-2 focus:ring-gf-cyber"
                    data-testid="checkbox-policies-agree"
                  />
                  <span className="text-sm text-gf-snow">
                    I understand and agree to follow all content policies and compliance requirements
                  </span>
                </label>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 max-w-2xl mx-auto px-4">
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gf-snow mb-2">Build Your Creator Brand</h2>
              <p className="text-sm sm:text-base text-gf-steel">Tell your fanz who you are</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gf-snow mb-2 block">
                  Display Name
                </label>
                <Input
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  placeholder="Your real or stage name"
                  className="bg-gf-ink border-gf-steel/20"
                  data-testid="input-display-name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gf-snow mb-2 block">
                  Stage Name (Optional)
                </label>
                <Input
                  value={formData.stageName}
                  onChange={(e) =>
                    setFormData({ ...formData, stageName: e.target.value })
                  }
                  placeholder="Your creative alias"
                  className="bg-gf-ink border-gf-steel/20"
                  data-testid="input-stage-name"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gf-snow mb-2 block">
                Pronouns
              </label>
              <Input
                value={formData.pronouns}
                onChange={(e) =>
                  setFormData({ ...formData, pronouns: e.target.value })
                }
                placeholder="she/her, they/them, etc."
                className="bg-gf-ink border-gf-steel/20"
                data-testid="input-pronouns"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gf-snow mb-2 block">
                Bio
              </label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell your story... What makes you unique?"
                className="bg-gf-ink border-gf-steel/20 min-h-[100px]"
                data-testid="input-bio"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gf-snow mb-3 block">
                Select Your Niches (Choose up to 3)
              </label>
              <div className="flex flex-wrap gap-2">
                {niches.map((niche) => (
                  <Badge
                    key={niche}
                    onClick={() => toggleNiche(niche)}
                    className={`cursor-pointer transition-all ${
                      formData.selectedNiches.includes(niche)
                        ? "bg-gradient-to-r from-gf-cyber to-gf-pink text-white"
                        : "bg-gf-charcoal/50 border-gf-steel/20 text-gf-steel hover:border-gf-cyber"
                    }`}
                    data-testid={`badge-niche-${niche.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {niche}
                  </Badge>
                ))}
              </div>
            </div>

            <Card className="bg-gf-charcoal/30 border-gf-cyber/20">
              <CardContent className="p-4 flex items-start gap-3">
                <Upload className="h-5 w-5 text-gf-cyber flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gf-snow">
                    Avatar & Banner Upload
                  </p>
                  <p className="text-xs text-gf-steel mt-1">
                    Upload your profile picture and cover banner to stand out
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 border-gf-steel/20"
                    data-testid="button-upload-media"
                  >
                    Upload Media
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <Shield className="h-16 w-16 text-gf-cyber mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gf-snow mb-2">
                Identity Verification
              </h2>
              <p className="text-gf-steel">Quick and secure verification process</p>
            </div>

            <Card className="bg-gf-charcoal/50 border-gf-steel/20">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gf-cyber/20 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-gf-cyber" />
                      </div>
                      <div>
                        <p className="font-medium text-gf-snow">ID Verification</p>
                        <p className="text-sm text-gf-steel">Upload government ID</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gf-steel/20"
                      data-testid="button-upload-id"
                    >
                      Upload
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gf-pink/20 flex items-center justify-center">
                        <Camera className="h-5 w-5 text-gf-pink" />
                      </div>
                      <div>
                        <p className="font-medium text-gf-snow">Selfie Match</p>
                        <p className="text-sm text-gf-steel">Quick photo verification</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gf-steel/20"
                      data-testid="button-take-selfie"
                    >
                      Take Photo
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gf-cyber/20 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-gf-cyber" />
                      </div>
                      <div>
                        <p className="font-medium text-gf-snow">Age & Consent Forms</p>
                        <p className="text-sm text-gf-steel">Quick legal compliance</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gf-steel/20"
                      data-testid="button-sign-forms"
                    >
                      Sign
                    </Button>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gf-ink rounded-lg">
                  <p className="text-xs text-gf-steel text-center">
                    🔒 Your information is encrypted and secure. We use bank-level security
                    to protect your data.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <DollarSign className="h-16 w-16 text-gf-cyber mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gf-snow mb-2">
                Monetization Setup
              </h2>
              <p className="text-gf-steel">Choose how you want to get paid</p>
            </div>

            <Card className="bg-gradient-to-r from-gf-cyber/10 to-gf-pink/10 border-gf-cyber/20">
              <CardContent className="p-6 text-center">
                <p className="text-lg font-semibold text-gf-snow mb-2">
                  💰 Here&apos;s how much you&apos;ll earn
                </p>
                <p className="text-4xl font-bold bg-gradient-to-r from-gf-cyber to-gf-pink bg-clip-text text-transparent">
                  100% Yours
                </p>
                <p className="text-sm text-gf-steel mt-2">
                  No platform fees. No hidden charges. Every penny goes to you.
                </p>
              </CardContent>
            </Card>

            <div>
              <label className="text-sm font-medium text-gf-snow mb-3 block">
                Payout Method
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {["paypal", "bank", "crypto"].map((method) => (
                  <Card
                    key={method}
                    onClick={() => setFormData({ ...formData, payoutMethod: method })}
                    className={`cursor-pointer transition-all ${
                      formData.payoutMethod === method
                        ? "bg-gf-cyber/20 border-gf-cyber"
                        : "bg-gf-charcoal/30 border-gf-steel/20 hover:border-gf-cyber/50"
                    }`}
                    data-testid={`card-payout-${method}`}
                  >
                    <CardContent className="p-4 text-center">
                      <CreditCard className="h-6 w-6 text-gf-cyber mx-auto mb-2" />
                      <p className="text-sm font-medium text-gf-snow capitalize">
                        {method}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gf-snow mb-2 block">
                {formData.payoutMethod === "paypal"
                  ? "PayPal Email"
                  : formData.payoutMethod === "bank"
                  ? "Bank Account"
                  : "Crypto Wallet Address"}
              </label>
              <Input
                value={formData.payoutEmail}
                onChange={(e) =>
                  setFormData({ ...formData, payoutEmail: e.target.value })
                }
                placeholder={
                  formData.payoutMethod === "paypal"
                    ? "your@email.com"
                    : formData.payoutMethod === "bank"
                    ? "Account number"
                    : "Wallet address"
                }
                className="bg-gf-ink border-gf-steel/20"
                data-testid="input-payout-details"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <Sparkles className="h-24 w-24 text-gf-cyber animate-pulse" />
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gf-cyber to-gf-pink bg-clip-text text-transparent mb-4">
                You&apos;re All Set! 🎉
              </h2>
              <p className="text-gf-steel text-lg max-w-xl mx-auto">
                Your creator dashboard is ready. Start uploading content, engage with your
                fanz, and watch your community grow!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <Card className="bg-gf-charcoal/50 border-gf-steel/20">
                <CardContent className="p-6 text-center">
                  <Upload className="h-8 w-8 text-gf-cyber mx-auto mb-3" />
                  <p className="font-semibold text-gf-snow mb-2">Upload Content</p>
                  <p className="text-sm text-gf-steel">
                    Share photos, videos, and go live
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gf-charcoal/50 border-gf-steel/20">
                <CardContent className="p-6 text-center">
                  <Star className="h-8 w-8 text-gf-pink mx-auto mb-3" />
                  <p className="font-semibold text-gf-snow mb-2">Engage Fanz</p>
                  <p className="text-sm text-gf-steel">Messages, comments, and reactions</p>
                </CardContent>
              </Card>
              <Card className="bg-gf-charcoal/50 border-gf-steel/20">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-8 w-8 text-gf-cyber mx-auto mb-3" />
                  <p className="font-semibold text-gf-snow mb-2">Track Analytics</p>
                  <p className="text-sm text-gf-steel">See your growth and earnings</p>
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
                  Enter Your Dashboard
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
                        ? "bg-gradient-to-r from-gf-cyber to-gf-pink border-gf-cyber"
                        : "bg-gf-charcoal border-gf-steel/20"
                    }`}
                  >
                    <step.icon className="h-6 w-6" />
                  </div>
                  <p
                    className={`text-xs mt-2 font-medium ${
                      currentStep >= step.id ? "text-gf-cyber" : "text-gf-steel"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-all ${
                      currentStep > step.id ? "bg-gf-cyber" : "bg-gf-steel/20"
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
        {currentStep !== 6 && (
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
              onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
              className="bg-gradient-to-r from-gf-cyber to-gf-pink hover:opacity-90"
              data-testid="button-next"
            >
              {currentStep === 5 ? "Complete Setup" : "Next"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
