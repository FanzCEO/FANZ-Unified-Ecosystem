import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import AIChat from "@/pages/ai-chat";
import ContentGenerator from "@/pages/content-generator";
import ImageGenerator from "@/pages/image-generator";
import EmailTemplates from "@/pages/email-templates";
import SocialScheduler from "@/pages/social-scheduler";
import LeadSourcing from "@/pages/lead-sourcing";
import AutomationDashboard from "@/pages/automation-dashboard";
import Header from "@/components/header";
import Footer from "@/components/footer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/tools/ai-chat" component={AIChat} />
      <Route path="/tools/content-generator">
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <ContentGenerator />
          </main>
          <Footer />
        </div>
      </Route>
      <Route path="/tools/image-generator">
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <ImageGenerator />
          </main>
          <Footer />
        </div>
      </Route>
      <Route path="/tools/email-templates">
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <EmailTemplates />
          </main>
          <Footer />
        </div>
      </Route>
      <Route path="/tools/social-scheduler">
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <SocialScheduler />
          </main>
          <Footer />
        </div>
      </Route>
      <Route path="/tools/lead-sourcing">
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <LeadSourcing />
          </main>
          <Footer />
        </div>
      </Route>
      <Route path="/automation">
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <AutomationDashboard />
          </main>
          <Footer />
        </div>
      </Route>
      <Route>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <NotFound />
          </main>
          <Footer />
        </div>
      </Route>
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
