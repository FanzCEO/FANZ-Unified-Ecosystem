import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Messages from "@/pages/messages";
import Content from "@/pages/content";
import Analytics from "@/pages/analytics";
import Profile from "@/pages/profile";
import Subscribers from "@/pages/subscribers";
import Settings from "@/pages/settings";
import FanSignup from "@/pages/fan-signup";
import FanDashboard from "@/pages/fan-dashboard";
import Auth from "@/pages/auth";
import ResetPassword from "@/pages/reset-password";
import Explore from "@/pages/explore";
import Live from "@/pages/live";
import Shop from "@/pages/shop";
import Referrals from "@/pages/referrals";
import AccessGate from "@/pages/access-gate";
import VerificationSignup from "@/pages/verification-signup";
import Stories from "@/pages/stories";
import PPV from "@/pages/ppv";
import Polls from "@/pages/polls";

// Home component wrapper to handle user type routing
function Home() {
  const { user } = useAuth();
  const hasCreatorProfile = (user as any)?.hasCreatorProfile;
  
  if (hasCreatorProfile) {
    return <Dashboard />;
  } else {
    return <FanDashboard />;
  }
}

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 animate-spin border-2 border-primary border-t-transparent rounded-full" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/access-gate" component={AccessGate} />
          <Route path="/verification-signup" component={VerificationSignup} />
          <Route path="/auth" component={Auth} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/fan-signup" component={FanSignup} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/explore" component={Explore} />
          <Route path="/stories" component={Stories} />
          <Route path="/ppv" component={PPV} />
          <Route path="/polls" component={Polls} />
          <Route path="/live" component={Live} />
          <Route path="/shop" component={Shop} />
          <Route path="/referrals" component={Referrals} />
          <Route path="/messages" component={Messages} />
          <Route path="/content" component={Content} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/profile" component={Profile} />
          <Route path="/subscribers" component={Subscribers} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
