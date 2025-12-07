import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import FloatingAIAssistant from "@/components/floating-ai-assistant";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import KYCForm from "@/pages/compliance/kyc";
import StarConsentForm from "@/pages/compliance/star-consent";
import DocumentUpload from "@/pages/compliance/documents";
import PlatformsServices from "@/pages/platforms-services";
import System from "@/pages/system";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/compliance/kyc" component={KYCForm} />
      <Route path="/compliance/star-consent" component={StarConsentForm} />
      <Route path="/compliance/documents" component={DocumentUpload} />
      <Route path="/platforms-services" component={PlatformsServices} />
      <Route path="/system" component={System} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Toaster />
          <Router />
          <FloatingAIAssistant />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
