import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function OnboardingInterests() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  const { data: niches, isLoading } = useQuery<any[]>({
    queryKey: ["/api/niches"],
  });

  const isCreator = user?.role === "creator";

  const toggleNiche = (nicheId: string) => {
    setSelectedNiches((prev) =>
      prev.includes(nicheId)
        ? prev.filter((id) => id !== nicheId)
        : [...prev, nicheId]
    );
  };

  const handleContinue = async () => {
    if (selectedNiches.length === 0) {
      toast({
        title: "Select at least one interest",
        description: "This helps us personalize your experience",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("/api/onboarding/select-interests", {
        method: "POST",
        body: JSON.stringify({ nicheIds: selectedNiches }),
      });

      await apiRequest("/api/onboarding/complete", {
        method: "POST",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/progress"] });
      setLocation("/onboarding/complete");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save interests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="max-w-4xl w-full border-2 border-cyan-500/30 bg-black/40 backdrop-blur">
        <CardHeader className="text-center pb-4 sm:pb-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {isCreator ? "What Do You Create?" : "What Are You Into?"}
          </CardTitle>
          <p className="text-sm sm:text-base text-gray-400 mt-2">
            {isCreator
              ? "Select the niches that match your content"
              : "Pick your interests to discover amazing creators"}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Select as many as you like
          </p>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {niches?.map((niche) => (
              <div
                key={niche.id}
                className={`
                  relative border-2 rounded-lg p-3 sm:p-4 transition-all
                  ${
                    selectedNiches.includes(niche.id)
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-gray-700 bg-gray-900/30"
                  }
                `}
                data-testid={`niche-${niche.slug}`}
              >
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <Checkbox
                    checked={selectedNiches.includes(niche.id)}
                    onCheckedChange={() => toggleNiche(niche.id)}
                    className="mt-0.5 sm:mt-1 flex-shrink-0"
                    data-testid={`checkbox-niche-${niche.slug}`}
                  />
                  <label 
                    htmlFor={`checkbox-${niche.id}`}
                    className="flex-1 cursor-pointer min-h-[44px] flex flex-col justify-center"
                    onClick={() => toggleNiche(niche.id)}
                  >
                    <h3 className="font-semibold text-white text-sm sm:text-base mb-1">{niche.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{niche.description}</p>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {selectedNiches.length > 0 && (
            <div className="text-center text-xs sm:text-sm text-gray-400">
              {selectedNiches.length} {selectedNiches.length === 1 ? "interest" : "interests"} selected
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/onboarding/profile")}
              className="w-full sm:flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 h-11 sm:h-auto"
              disabled={isSubmitting}
              data-testid="button-back"
            >
              Back
            </Button>
            <Button
              onClick={handleContinue}
              className="w-full sm:flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold h-11 sm:h-auto"
              disabled={isSubmitting || selectedNiches.length === 0}
              data-testid="button-continue"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finishing...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
