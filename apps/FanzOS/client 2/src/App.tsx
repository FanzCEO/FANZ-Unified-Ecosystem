import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import CreatorDashboard from "@/pages/creator-dashboard";
import FanzDashboard from "@/pages/fanz-dashboard";
import Profile from "@/pages/profile";
import CreatorProfile from "@/pages/creator-profile";
import FanzProfile from "@/pages/fanz-profile";
import FANZfluence from "@/pages/fanzfluence";
import Contests from "@/pages/contests";
import Messages from "@/pages/messages";
import Explore from "@/pages/explore";
import Merchandise from "@/pages/merchandise";
import Nearby from "@/pages/nearby";
import Settings from "@/pages/settings";
import SystemMap from "@/pages/system-map";
import Games from "@/pages/games";
import TermsConditions from "@/pages/legal/terms-conditions";
import Privacy from "@/pages/legal/privacy";
import About from "@/pages/legal/about";
import ContentData from "@/pages/legal/content-data";
import Cookies from "@/pages/legal/cookies";
import LegalCompliance from "@/pages/legal/legal-compliance";
import Complaint from "@/pages/legal/complaint";
import CancellationPolicy from "@/pages/legal/cancellation-policy";
import ModelRelease2257 from "@/pages/legal/model-release-2257";
import CoStar2257 from "@/pages/legal/co-star-2257";
import TransactionChargeback from "@/pages/legal/transaction-chargeback";
import Footer from "@/components/Footer";
import PaymentSuccess from "@/pages/payment-success";
import PaymentCancel from "@/pages/payment-cancel";
import PaymentError from "@/pages/payment-error";
import ShortVideos from "@/pages/short-videos";
import AIAssistant from "@/pages/ai-assistant";
import AvatarStudio from "@/pages/avatar-studio";
import CollaborationHub from "@/pages/collaboration-hub";
import SocialMediaTools from "@/pages/social-media-tools";
import ServerDashboard from "@/pages/server-dashboard";
import AgeVerification from "@/components/age-verification";
import { Footer } from "@/components/trust-framework";
import LegalLibrary from "@/pages/legal-library";
import ComplianceDashboard from "@/pages/compliance-dashboard";
import LegalVault from "@/pages/legal-vault";
import RealTimeTest from "@/pages/RealTimeTest";
import { useState, useEffect } from "react";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [ageVerified, setAgeVerified] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem('ageVerified') === 'true';
    setAgeVerified(verified);
  }, []);

  if (!ageVerified) {
    return <AgeVerification onVerified={() => setAgeVerified(true)} />;
  }

  return (
    <Switch>
      {/* Payment result pages - accessible without authentication */}
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/payment/cancel" component={PaymentCancel} />
      <Route path="/payment/error" component={PaymentError} />
      
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={SystemMap} />
          <Route path="/system-map" component={SystemMap} />
          <Route path="/dashboard" component={user?.role === 'creator' ? CreatorDashboard : FanzDashboard} />
          <Route path="/creator-dashboard" component={CreatorDashboard} />
          <Route path="/fanz-dashboard" component={FanzDashboard} />
          <Route path="/profile/:username" component={Profile} />
          <Route path="/creator/:username" component={CreatorProfile} />
          <Route path="/fanz/:username" component={FanzProfile} />
          <Route path="/fanzfluence" component={FANZfluence} />
          <Route path="/contests" component={Contests} />
          <Route path="/messages" component={Messages} />
          <Route path="/explore" component={Explore} />
          <Route path="/merchandise" component={Merchandise} />
          <Route path="/nearby" component={Nearby} />
          <Route path="/settings" component={Settings} />
          <Route path="/short-videos" component={ShortVideos} />
          <Route path="/ai-assistant" component={AIAssistant} />
          <Route path="/avatar-studio" component={AvatarStudio} />
          <Route path="/collaboration-hub" component={CollaborationHub} />
          <Route path="/social-media-tools" component={SocialMediaTools} />
          <Route path="/server-dashboard" component={ServerDashboard} />
          <Route path="/home" component={Home} />
          <Route path="/legal-library" component={LegalLibrary} />
          <Route path="/compliance-dashboard" component={ComplianceDashboard} />
          <Route path="/legal-vault" component={LegalVault} />
          <Route path="/realtime-test" component={RealTimeTest} />
          <Route path="/games" component={Games} />
          <Route path="/legal/terms-conditions" component={TermsConditions} />
          <Route path="/legal/privacy" component={Privacy} />
          <Route path="/legal/about" component={About} />
          <Route path="/legal/content-data" component={ContentData} />
          <Route path="/legal/cookies" component={Cookies} />
          <Route path="/legal/legal-compliance" component={LegalCompliance} />
          <Route path="/legal/complaint" component={Complaint} />
          <Route path="/legal/cancellation-policy" component={CancellationPolicy} />
          <Route path="/legal/model-release-2257" component={ModelRelease2257} />
          <Route path="/legal/co-star-2257" component={CoStar2257} />
          <Route path="/legal/transaction-chargeback" component={TransactionChargeback} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">
            <Router />
          </div>
          <Footer />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
