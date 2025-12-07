import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Offers from "@/pages/offers";
import Tracking from "@/pages/tracking";
import Payouts from "@/pages/payouts";
import Analytics from "@/pages/analytics";
import KYC from "@/pages/kyc";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Topbar />
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <AppLayout><Dashboard /></AppLayout>} />
      <Route path="/offers" component={() => <AppLayout><Offers /></AppLayout>} />
      <Route path="/tracking" component={() => <AppLayout><Tracking /></AppLayout>} />
      <Route path="/payouts" component={() => <AppLayout><Payouts /></AppLayout>} />
      <Route path="/analytics" component={() => <AppLayout><Analytics /></AppLayout>} />
      <Route path="/kyc" component={() => <AppLayout><KYC /></AppLayout>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
