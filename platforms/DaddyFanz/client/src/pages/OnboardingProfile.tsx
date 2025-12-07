import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type ProfileFormData = {
  displayName: string;
  stageName?: string;
  pronouns?: string;
  bio?: string;
};

export default function OnboardingProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: user, isLoading: isLoadingUser } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  const { data: progress } = useQuery<any>({
    queryKey: ["/api/onboarding/progress"],
  });

  const form = useForm<ProfileFormData>({
    defaultValues: {
      displayName: "",
      stageName: "",
      pronouns: "",
      bio: "",
    },
  });

  const isCreator = user?.role === "creator";

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      await apiRequest("/api/onboarding/setup-profile", {
        method: "POST",
        body: JSON.stringify(data),
      });

      toast({
        title: "Profile updated!",
        description: "Let's personalize your experience",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/progress"] });
      setLocation("/onboarding/interests");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="max-w-2xl w-full border-2 border-cyan-500/30 bg-black/40 backdrop-blur">
        <CardHeader className="text-center pb-4 sm:pb-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {isCreator ? "Set Up Your Star Profile" : "Create Your Fanz Profile"}
          </CardTitle>
          <p className="text-sm sm:text-base text-gray-400 mt-2">
            {isCreator 
              ? "Tell your fans who you are and what makes you unique"
              : "Let creators know a bit about yourself"
            }
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                rules={{ required: "Display name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">Display Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your name"
                        className="bg-gray-900/50 border-gray-700 text-white h-11"
                        data-testid="input-display-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isCreator && (
                <FormField
                  control={form.control}
                  name="stageName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">
                        Stage Name / Performer Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Your professional name"
                          className="bg-gray-900/50 border-gray-700 text-white h-11"
                          data-testid="input-stage-name"
                        />
                      </FormControl>
                      <p className="text-sm text-gray-500">
                        This is how fans will find you
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="pronouns"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">Pronouns (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., she/her, he/him, they/them"
                        className="bg-gray-900/50 border-gray-700 text-white h-11"
                        data-testid="input-pronouns"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">
                      {isCreator ? "Creator Bio" : "About You"}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={isCreator 
                          ? "Tell your fans what kind of content you create..."
                          : "Share a bit about yourself and your interests..."
                        }
                        className="bg-gray-900/50 border-gray-700 text-white min-h-[120px]"
                        data-testid="textarea-bio"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/onboarding")}
                  className="w-full sm:flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 h-11 sm:h-auto"
                  disabled={isSubmitting}
                  data-testid="button-back"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold h-11 sm:h-auto"
                  disabled={isSubmitting}
                  data-testid="button-continue"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
