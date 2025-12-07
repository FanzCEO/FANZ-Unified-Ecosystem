import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EnhancedHeader } from "@/components/layout/EnhancedHeader";
import { useAuth } from "@/hooks/useAuth";

// Pages
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import CreatorProfile from "@/pages/CreatorProfile";
import Messages from "@/pages/Messages";
import Settings from "@/pages/Settings";
import Moderation from "@/pages/Moderation";
import SystemHealth from "@/pages/SystemHealth";
import { Verification } from "@/pages/Verification";
import { CreatorDashboard } from "@/pages/CreatorDashboard";
import HelpCenter from "@/pages/HelpCenter";
import SupportTickets from "@/pages/SupportTickets";
import WikiPage from "@/pages/WikiPage";
import TutorialsPage from "@/pages/TutorialsPage";
import TutorialDetailPage from "@/pages/TutorialDetailPage";
import FanzMoneyCenter from "@/pages/FanzMoneyCenter";
import Feed from "@/pages/Feed";
import LiveStreams from "@/pages/LiveStreams";
import Discover from "@/pages/Discover";
import CreatorAnalytics from "@/pages/CreatorAnalytics";
import CreatorOnboardingPage from "@/pages/CreatorOnboardingPage";
import FanzOnboardingPage from "@/pages/FanzOnboardingPage";
import CreatorStudio from "@/pages/CreatorStudio";
import NotFound from "@/pages/not-found";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import CookiePolicy from "@/pages/CookiePolicy";
import Compliance from "@/pages/Compliance";
import About from "@/pages/About";
import Safety from "@/pages/Safety";
import Guidelines from "@/pages/Guidelines";
import Contact from "@/pages/Contact";
import ForCreators from "@/pages/ForCreators";
import ForFans from "@/pages/ForFans";
import Pricing from "@/pages/Pricing";
import Features from "@/pages/Features";
import Careers from "@/pages/Careers";
import Press from "@/pages/Press";
import Blog from "@/pages/Blog";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gf-ink text-gf-snow flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <EnhancedHeader />
      <Switch>
        {/* Public footer pages - accessible to everyone */}
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={TermsOfService} />
        <Route path="/cookies" component={CookiePolicy} />
        <Route path="/compliance" component={Compliance} />
        <Route path="/about" component={About} />
        <Route path="/safety" component={Safety} />
        <Route path="/guidelines" component={Guidelines} />
        <Route path="/contact" component={Contact} />
        <Route path="/creators" component={ForCreators} />
        <Route path="/fans" component={ForFans} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/features" component={Features} />
        <Route path="/careers" component={Careers} />
        <Route path="/press" component={Press} />
        <Route path="/blog" component={Blog} />
        
        {/* Public help pages - accessible to everyone */}
        <Route path="/help" component={HelpCenter} />
        <Route path="/help/tickets" component={SupportTickets} />
        <Route path="/help/contact" component={SupportTickets} />
        <Route path="/wiki/article/:slug" component={WikiPage} />
        <Route path="/wiki" component={WikiPage} />
        <Route path="/tutorials/:id" component={TutorialDetailPage} />
        <Route path="/tutorials" component={TutorialsPage} />
        
        {/* Onboarding flows - public routes */}
        <Route path="/onboarding/creator" component={CreatorOnboardingPage} />
        <Route path="/onboarding/fan" component={FanzOnboardingPage} />
        
        {!isAuthenticated ? (
          <>
            <Route path="/" component={Landing} />
            <Route path="/discover" component={Landing} />
            <Route path="/following" component={Landing} />
            <Route path="/messages" component={Landing} />
            <Route path="/live" component={Landing} />
          </>
        ) : (
          <>
            <Route path="/" component={Feed} />
            <Route path="/feed" component={Feed} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/discover" component={Discover} />
            <Route path="/following" component={Dashboard} />
            <Route path="/live" component={LiveStreams} />
            <Route path="/streams" component={LiveStreams} />
            <Route path="/profile" component={CreatorProfile} />
            <Route path="/content" component={Dashboard} />
            <Route path="/messages" component={Messages} />
            <Route path="/analytics" component={CreatorAnalytics} />
            <Route path="/creator-analytics" component={CreatorAnalytics} />
            <Route path="/creator-studio" component={CreatorStudio} />
            <Route path="/studio" component={CreatorStudio} />
            <Route path="/earnings" component={CreatorDashboard} />
            <Route path="/settings" component={Settings} />
            <Route path="/verification" component={Verification} />
            <Route path="/moderation" component={Moderation} />
            <Route path="/health" component={SystemHealth} />
            <Route path="/money" component={FanzMoneyCenter} />
            <Route path="/wallet" component={FanzMoneyCenter} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gf-ink ghost-background">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
