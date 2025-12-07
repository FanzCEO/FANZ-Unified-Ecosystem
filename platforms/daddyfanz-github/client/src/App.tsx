import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useCSRF } from "@/hooks/useCSRF";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import CreatorProfile from "@/pages/CreatorProfile";
import Messages from "@/pages/Messages";
import Settings from "@/pages/Settings";
import Verification from "@/pages/Verification";
import CreatorGuide from "@/pages/CreatorGuide";
import AIWiki from "@/pages/AIWiki";
import Tutorials from "@/pages/Tutorials";
import HelpDesk from "@/pages/HelpDesk";
import ContentUpload from "@/pages/ContentUpload";
import ContentManage from "@/pages/ContentManage";
import Feed from "@/pages/Feed";
import NotFound from "@/pages/not-found";
import OnboardingWelcome from "@/pages/OnboardingWelcome";
import OnboardingProfile from "@/pages/OnboardingProfile";
import OnboardingInterests from "@/pages/OnboardingInterests";
import OnboardingComplete from "@/pages/OnboardingComplete";
import ResetPassword from "@/pages/ResetPassword";
import NftDashboard from "@/pages/NftDashboard";
import NftMarketplace from "@/pages/NftMarketplace";
import CreatorLoanDashboard from "@/pages/CreatorLoanDashboard";
import FanLendingDashboard from "@/pages/FanLendingDashboard";
import LegalPage from "@/pages/LegalPage";
import ContactPage from "@/pages/ContactPage";
import PaymentHelpPage from "@/pages/PaymentHelpPage";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  useCSRF(); // Initialize CSRF token on app load

  return (
    <Switch>
      {/* Public routes available to all users */}
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/ai-wiki" component={AIWiki} />
      <Route path="/tutorials" component={Tutorials} />
      <Route path="/help-desk" component={HelpDesk} />
      <Route path="/help" component={HelpDesk} />
      <Route path="/feed" component={Feed} />
      
      {/* Legal and Support Pages */}
      <Route path="/legal/:page" component={LegalPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/payment-help" component={PaymentHelpPage} />
      
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          {/* Onboarding routes */}
          <Route path="/onboarding" component={OnboardingWelcome} />
          <Route path="/onboarding/profile" component={OnboardingProfile} />
          <Route path="/onboarding/interests" component={OnboardingInterests} />
          <Route path="/onboarding/complete" component={OnboardingComplete} />
          
          {/* Main app routes */}
          <Route path="/" component={Dashboard} />
          <Route path="/profile" component={CreatorProfile} />
          <Route path="/messages" component={Messages} />
          <Route path="/content-upload" component={ContentUpload} />
          <Route path="/content-manage" component={ContentManage} />
          <Route path="/nft-dashboard" component={NftDashboard} />
          <Route path="/nft-marketplace" component={NftMarketplace} />
          <Route path="/loans/creator" component={CreatorLoanDashboard} />
          <Route path="/loans/lend" component={FanLendingDashboard} />
          <Route path="/settings" component={Settings} />
          <Route path="/verification" component={Verification} />
          <Route path="/creator-guide" component={CreatorGuide} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div className="dark">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
