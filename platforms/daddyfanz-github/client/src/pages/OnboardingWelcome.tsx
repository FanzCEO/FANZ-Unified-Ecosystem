import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function OnboardingWelcome() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast} = useToast();

  const selectRole = async (role: "creator" | "fan") => {
    setIsLoading(true);
    try {
      await apiRequest("/api/onboarding/select-role", {
        method: "POST",
        body: JSON.stringify({ role }),
      });

      // Invalidate user query to refresh role
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: "Welcome aboard!",
        description: `Let's set up your ${role === "creator" ? "Star" : "Fanz"} profile`,
      });

      setLocation("/onboarding/profile");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to select role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Welcome to DaddyFanz
          </h1>
          <p className="text-lg sm:text-xl text-gray-300">Choose your journey</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {/* Creator Card */}
          <Card 
            className="border-2 border-cyan-500/30 bg-black/40 backdrop-blur hover:border-cyan-500 transition-all cursor-pointer group"
            onClick={() => !isLoading && selectRole("creator")}
            data-testid="card-creator-role"
          >
            <CardHeader className="text-center pb-4 sm:pb-6">
              <div className="mx-auto mb-3 sm:mb-4 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Star className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-cyan-400">
                I'm a Creator
              </CardTitle>
              <CardDescription className="text-base sm:text-lg text-gray-300 mt-2">
                Claim Your Star Power
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5">
              <ul className="space-y-2.5 sm:space-y-3 text-sm sm:text-base text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5 sm:mt-1 flex-shrink-0">✓</span>
                  <span>100% of earnings go directly to you</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5 sm:mt-1 flex-shrink-0">✓</span>
                  <span>Full content ownership & control</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5 sm:mt-1 flex-shrink-0">✓</span>
                  <span>Advanced creator tools & analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5 sm:mt-1 flex-shrink-0">✓</span>
                  <span>Direct connection with your fans</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-4 sm:py-5 lg:py-6 text-base sm:text-lg"
                disabled={isLoading}
                data-testid="button-select-creator"
              >
                Start as Creator
              </Button>
            </CardContent>
          </Card>

          {/* Fan Card */}
          <Card 
            className="border-2 border-purple-500/30 bg-black/40 backdrop-blur hover:border-purple-500 transition-all cursor-pointer group"
            onClick={() => !isLoading && selectRole("fan")}
            data-testid="card-fan-role"
          >
            <CardHeader className="text-center pb-4 sm:pb-6">
              <div className="mx-auto mb-3 sm:mb-4 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-purple-400">
                I'm a Fanz
              </CardTitle>
              <CardDescription className="text-base sm:text-lg text-gray-300 mt-2">
                Discover. Connect. Support.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5">
              <ul className="space-y-2.5 sm:space-y-3 text-sm sm:text-base text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5 sm:mt-1 flex-shrink-0">✓</span>
                  <span>Discover amazing creators</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5 sm:mt-1 flex-shrink-0">✓</span>
                  <span>Exclusive content & experiences</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5 sm:mt-1 flex-shrink-0">✓</span>
                  <span>Direct interaction with stars</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5 sm:mt-1 flex-shrink-0">✓</span>
                  <span>Support your favorite creators</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 sm:py-5 lg:py-6 text-base sm:text-lg"
                disabled={isLoading}
                data-testid="button-select-fan"
              >
                Start as Fanz
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-gray-400 mt-6 sm:mt-8 text-xs sm:text-sm">
          Don't worry, you can always upgrade from Fanz to Creator later
        </p>
      </div>
    </div>
  );
}
