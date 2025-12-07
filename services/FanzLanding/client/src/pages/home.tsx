import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import AgeGate from "@/components/age-gate";
import Header from "@/components/header";
import CreatorSpotlight from "@/components/creator-spotlight";
import VideoCard from "@/components/video-card";
import PromotionalBanner from "@/components/promotional-banner";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  UserPlus,
  Star,
  Users,
  Shield,
  Eye,
  EyeOff,
  Grid3X3,
} from "lucide-react";
import type { VideoWithCreator } from "@shared/schema";

export default function Home() {
  const [showAgeGate, setShowAgeGate] = useState(true);
  const [showSignupOptions, setShowSignupOptions] = useState(false);
  const [activeNetwork, setActiveNetwork] = useState("boyfanz");
  const [isContentBlurred, setIsContentBlurred] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Check if user is unverified FAN (from URL parameter)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get("verified");
    if (verified === "false") {
      setIsContentBlurred(true);
      setShowAgeGate(false);
      setShowSignupOptions(false);
    }
  }, []);

  const { data: featuredVideos, isLoading: featuredLoading } = useQuery<
    VideoWithCreator[]
  >({
    queryKey: ["/api/videos/featured"],
    enabled: !showAgeGate,
  });

  const { data: latestVideos, isLoading: latestLoading } = useQuery<
    VideoWithCreator[]
  >({
    queryKey: ["/api/videos/latest"],
    enabled: !showAgeGate,
  });

  const handleEnterSite = () => {
    setShowAgeGate(false);
    setShowSignupOptions(true);
  };

  const handleFanSignup = () => {
    // For FAN signup, create a simple registration that allows immediate entry with blurred content
    navigate("/register?type=fan");
  };

  const handleStarSignup = () => {
    // For STAR signup, go to the full 2257 compliance flow
    navigate("/register?type=star");
  };

  const handleSkipSignup = () => {
    setShowSignupOptions(false);
  };

  const handlePlayVideo = (videoId: string) => {
    if (isContentBlurred) {
      toast({
        title: "Verification Required",
        description:
          "Please verify your identity with VerifyMy to access content",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Video Player",
      description: "Video playback would be implemented here",
    });
  };

  const handleSendDM = (creatorId: string) => {
    if (isContentBlurred) {
      toast({
        title: "Verification Required",
        description:
          "Please verify your identity with VerifyMy to send messages",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Direct Message",
      description: "DM functionality would be implemented here",
    });
  };

  const handleVerifyIdentity = () => {
    toast({
      title: "VerifyMy Integration",
      description:
        "Identity verification with VerifyMy would be implemented here",
    });
    // After successful verification, remove blur
    // setIsContentBlurred(false);
  };

  if (showAgeGate) {
    return <AgeGate onEnter={handleEnterSite} />;
  }

  if (showSignupOptions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-background to-cyan-900 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl space-y-6">
          {/* Header */}
          <Card className="border-2 border-purple-500/20 bg-card/95 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                <UserPlus className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                Welcome to FANZ
              </CardTitle>
              <p className="text-lg text-muted-foreground">
                Choose your account type to get started
              </p>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FAN Signup */}
            <Card
              className="border-2 border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-400/40 transition-all cursor-pointer"
              onClick={handleFanSignup}
            >
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-cyan-500/20 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-cyan-400" />
                </div>
                <CardTitle className="text-2xl text-cyan-400">
                  Join as FAN
                </CardTitle>
                <p className="text-muted-foreground">
                  Enjoy content from your favorite creators
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-green-400">✓</span>
                    <span>Immediate platform access</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-yellow-400">⚠</span>
                    <span>Content blurred until verification</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-green-400">✓</span>
                    <span>Browse all creators and content</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-green-400">✓</span>
                    <span>Access to messaging and tips</span>
                  </div>
                </div>

                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-cyan-300 mb-2 flex items-center">
                    <EyeOff className="w-4 h-4 mr-2" />
                    Content Verification
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    To view uncensored content, you'll need to verify your
                    identity with VerifyMy when subscribing to creators or
                    purchasing VIP memberships.
                  </p>
                </div>

                <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
                  <Users className="w-4 h-4 mr-2" />
                  Sign Up as FAN
                </Button>
              </CardContent>
            </Card>

            {/* STAR Signup */}
            <Card
              className="border-2 border-purple-500/20 bg-purple-500/5 hover:border-purple-400/40 transition-all cursor-pointer"
              onClick={handleStarSignup}
            >
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Star className="w-8 h-8 text-purple-400" />
                </div>
                <CardTitle className="text-2xl text-purple-400">
                  Become a STAR
                </CardTitle>
                <p className="text-muted-foreground">
                  Create content and build your fanbase
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-green-400">✓</span>
                    <span>Monetize your content</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-green-400">✓</span>
                    <span>Direct fan messaging</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-green-400">✓</span>
                    <span>Revenue sharing program</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-green-400">✓</span>
                    <span>Professional creator tools</span>
                  </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-300 mb-2 flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Full 2257 Compliance Required
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Identity verification, age confirmation, document upload,
                    and digital consent forms are required for all content
                    creators.
                  </p>
                </div>

                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Star className="w-4 h-4 mr-2" />
                  Sign Up as STAR
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Skip Option */}
          <Card className="border-2 border-gray-500/20 bg-gray-500/5">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">
                Already have an account or want to browse first?
              </p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={handleSkipSignup}
                  className="mx-2"
                  data-testid="button-browse-platform"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Browse Platform
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/platforms-services")}
                  className="mx-2"
                  data-testid="button-platforms-services"
                >
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  View All Platforms & Services
                </Button>
                <Button
                  variant="link"
                  onClick={() => navigate("/login")}
                  className="mx-2 text-purple-400 hover:text-purple-300"
                >
                  Sign In to Existing Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        activeNetwork={activeNetwork}
        onNetworkChange={setActiveNetwork}
      />

      {/* Verification Banner for Unverified FAN Users */}
      {isContentBlurred && (
        <div className="bg-orange-500/10 border-b border-orange-500/20 py-3">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <EyeOff className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-orange-400 font-medium">
                    Content is currently blurred for your account
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Verify your identity with VerifyMy to unlock uncensored
                    content, or upgrade to VIP membership
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyIdentity}
                  className="border-orange-500/20 text-orange-400 hover:bg-orange-500/10"
                  data-testid="button-verify-identity"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Verify Identity
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "VIP Membership",
                      description:
                        "VIP membership upgrade would be implemented here",
                    });
                  }}
                  className="border-purple-500/20 text-purple-400 hover:bg-purple-500/10"
                  data-testid="button-vip-upgrade"
                >
                  <Star className="w-4 h-4 mr-2" />
                  VIP Upgrade
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PromotionalBanner type="top" />

      <CreatorSpotlight network={activeNetwork} />

      {/* Featured Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h2
            className="text-2xl font-bold mb-6"
            data-testid="section-featured"
          >
            Featured
          </h2>
          {featuredLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="w-full h-48 rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredVideos?.map((video) => (
                <div key={video.id} className="relative">
                  <VideoCard
                    video={video}
                    onPlay={handlePlayVideo}
                    onSendDM={handleSendDM}
                  />
                  {isContentBlurred && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <EyeOff className="w-8 h-8 mx-auto mb-2 text-orange-400" />
                        <p className="text-sm font-medium text-orange-400">
                          Verification Required
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Verify to unlock
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trending Sites Section */}
      <section className="py-8 bg-secondary">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-2xl font-bold"
              data-testid="section-trending-sites"
            >
              Platform Clusters
            </h2>
            <Button
              variant="link"
              onClick={() => navigate("/platforms-services")}
              className="text-accent hover:text-accent-foreground font-medium"
              data-testid="button-view-all-sites"
            >
              View All
            </Button>
          </div>
          <div className="bg-card rounded-lg p-6 flex items-center space-x-4">
            <img
              src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&h=120&fit=crop"
              alt="Network preview interface"
              className="w-24 h-16 rounded object-cover"
              data-testid="img-demo-content"
            />
            <div>
              <h3 className="font-bold text-lg" data-testid="text-demo-title">
                FANZ Platform Portal
              </h3>
              <p
                className="text-muted-foreground"
                data-testid="text-demo-description"
              >
                Professional Creator Platform with Enterprise Security - Access
                14 specialized clusters
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" data-testid="section-latest">
              Latest
            </h2>
            <Button
              variant="link"
              className="text-accent hover:text-accent-foreground font-medium"
              data-testid="button-view-all-latest"
            >
              View All
            </Button>
          </div>
          {latestLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="w-full h-48 rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestVideos?.map((video) => (
                <div key={video.id} className="relative">
                  <VideoCard
                    video={video}
                    onPlay={handlePlayVideo}
                    onSendDM={handleSendDM}
                  />
                  {isContentBlurred && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <EyeOff className="w-8 h-8 mx-auto mb-2 text-orange-400" />
                        <p className="text-sm font-medium text-orange-400">
                          Verification Required
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Verify to unlock
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <PromotionalBanner type="bottom" />
      <Footer />
    </div>
  );
}
