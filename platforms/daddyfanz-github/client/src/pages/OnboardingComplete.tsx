import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Rocket } from "lucide-react";
import confetti from "canvas-confetti";

export default function OnboardingComplete() {
  const [, setLocation] = useLocation();
  const [showContent, setShowContent] = useState(false);

  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  const isCreator = user?.role === "creator";

  useEffect(() => {
    // Celebration animation
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        setShowContent(true);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    if (isCreator) {
      setLocation("/");
    } else {
      setLocation("/feed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="max-w-2xl w-full border-2 border-cyan-500/30 bg-black/40 backdrop-blur text-center">
        <CardContent className="pt-8 sm:pt-10 lg:pt-12 pb-8 sm:pb-10 lg:pb-12 px-4 sm:px-6 space-y-6 sm:space-y-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full animate-pulse" />
            </div>
            <div className="relative flex items-center justify-center">
              <div className="w-20 h-20 sm:w-[88px] sm:h-[88px] lg:w-24 lg:h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                {isCreator ? (
                  <Sparkles className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 text-white" />
                ) : (
                  <Rocket className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 text-white" />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent animate-fade-in px-2">
              {isCreator ? "You're All Set, Star! ⭐" : "Welcome to the Fanz Family! 🎉"}
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 px-2">
              {isCreator
                ? "Your creator profile is ready. Time to shine!"
                : "Your profile is ready. Let's discover amazing creators!"}
            </p>
          </div>

          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-lg p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold text-white">What's Next?</h2>
            <div className="text-left space-y-2.5 sm:space-y-3 text-sm sm:text-base text-gray-300">
              {isCreator ? (
                <>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-cyan-400 font-bold flex-shrink-0">1.</span>
                    <span>Upload your first content and start building your fanbase</span>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-cyan-400 font-bold flex-shrink-0">2.</span>
                    <span>Customize your subscription tiers and pricing</span>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-cyan-400 font-bold flex-shrink-0">3.</span>
                    <span>Engage with your fans through messages and live streams</span>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-cyan-400 font-bold flex-shrink-0">4.</span>
                    <span>Track your earnings and analytics in real-time</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-purple-400 font-bold flex-shrink-0">1.</span>
                    <span>Browse and discover creators in your favorite niches</span>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-purple-400 font-bold flex-shrink-0">2.</span>
                    <span>Follow creators to get updates on their latest content</span>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-purple-400 font-bold flex-shrink-0">3.</span>
                    <span>Subscribe to unlock exclusive content and perks</span>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-purple-400 font-bold flex-shrink-0">4.</span>
                    <span>Interact directly with your favorite stars</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <Button
            onClick={handleGetStarted}
            size="lg"
            className="w-full max-w-md mx-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-4 sm:py-5 lg:py-6 text-base sm:text-lg h-auto"
            data-testid="button-get-started"
          >
            {isCreator ? "Go to Dashboard" : "Start Exploring"}
          </Button>

          <p className="text-xs sm:text-sm text-gray-500 px-2">
            {isCreator
              ? "Remember: You keep 100% of your earnings!"
              : "Tip: You can upgrade to Creator anytime in Settings"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
