"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const wouter_1 = require("wouter");
const queryClient_1 = require("./lib/queryClient");
const react_query_1 = require("@tanstack/react-query");
const toaster_1 = require("@/components/ui/toaster");
const tooltip_1 = require("@/components/ui/tooltip");
const EnhancedHeader_1 = require("@/components/layout/EnhancedHeader");
const useAuth_1 = require("@/hooks/useAuth");
// Pages
const Landing_1 = __importDefault(require("@/pages/Landing"));
const Dashboard_1 = __importDefault(require("@/pages/Dashboard"));
const CreatorProfile_1 = __importDefault(require("@/pages/CreatorProfile"));
const Messages_1 = __importDefault(require("@/pages/Messages"));
const Settings_1 = __importDefault(require("@/pages/Settings"));
const Moderation_1 = __importDefault(require("@/pages/Moderation"));
const SystemHealth_1 = __importDefault(require("@/pages/SystemHealth"));
const Verification_1 = require("@/pages/Verification");
const CreatorDashboard_1 = require("@/pages/CreatorDashboard");
const HelpCenter_1 = __importDefault(require("@/pages/HelpCenter"));
const SupportTickets_1 = __importDefault(require("@/pages/SupportTickets"));
const WikiPage_1 = __importDefault(require("@/pages/WikiPage"));
const TutorialsPage_1 = __importDefault(require("@/pages/TutorialsPage"));
const TutorialDetailPage_1 = __importDefault(require("@/pages/TutorialDetailPage"));
const FanzMoneyCenter_1 = __importDefault(require("@/pages/FanzMoneyCenter"));
const Feed_1 = __importDefault(require("@/pages/Feed"));
const LiveStreams_1 = __importDefault(require("@/pages/LiveStreams"));
const Discover_1 = __importDefault(require("@/pages/Discover"));
const CreatorAnalytics_1 = __importDefault(require("@/pages/CreatorAnalytics"));
const CreatorOnboardingPage_1 = __importDefault(require("@/pages/CreatorOnboardingPage"));
const FanzOnboardingPage_1 = __importDefault(require("@/pages/FanzOnboardingPage"));
const CreatorStudio_1 = __importDefault(require("@/pages/CreatorStudio"));
const not_found_1 = __importDefault(require("@/pages/not-found"));
function Router() {
    const { isAuthenticated, isLoading } = (0, useAuth_1.useAuth)();
    if (isLoading) {
        return (React.createElement("div", { className: "min-h-screen bg-gf-ink text-gf-snow flex items-center justify-center" },
            React.createElement("div", { className: "text-xl" }, "Loading...")));
    }
    return (React.createElement(React.Fragment, null,
        React.createElement(EnhancedHeader_1.EnhancedHeader, null),
        React.createElement(wouter_1.Switch, null,
            React.createElement(wouter_1.Route, { path: "/help", component: HelpCenter_1.default }),
            React.createElement(wouter_1.Route, { path: "/help/tickets", component: SupportTickets_1.default }),
            React.createElement(wouter_1.Route, { path: "/help/contact", component: SupportTickets_1.default }),
            React.createElement(wouter_1.Route, { path: "/wiki/article/:slug", component: WikiPage_1.default }),
            React.createElement(wouter_1.Route, { path: "/wiki", component: WikiPage_1.default }),
            React.createElement(wouter_1.Route, { path: "/tutorials/:id", component: TutorialDetailPage_1.default }),
            React.createElement(wouter_1.Route, { path: "/tutorials", component: TutorialsPage_1.default }),
            React.createElement(wouter_1.Route, { path: "/onboarding/creator", component: CreatorOnboardingPage_1.default }),
            React.createElement(wouter_1.Route, { path: "/onboarding/fan", component: FanzOnboardingPage_1.default }),
            !isAuthenticated ? (React.createElement(React.Fragment, null,
                React.createElement(wouter_1.Route, { path: "/", component: Landing_1.default }),
                React.createElement(wouter_1.Route, { path: "/discover", component: Landing_1.default }),
                React.createElement(wouter_1.Route, { path: "/following", component: Landing_1.default }),
                React.createElement(wouter_1.Route, { path: "/messages", component: Landing_1.default }),
                React.createElement(wouter_1.Route, { path: "/live", component: Landing_1.default }))) : (React.createElement(React.Fragment, null,
                React.createElement(wouter_1.Route, { path: "/", component: Feed_1.default }),
                React.createElement(wouter_1.Route, { path: "/feed", component: Feed_1.default }),
                React.createElement(wouter_1.Route, { path: "/dashboard", component: Dashboard_1.default }),
                React.createElement(wouter_1.Route, { path: "/discover", component: Discover_1.default }),
                React.createElement(wouter_1.Route, { path: "/following", component: Dashboard_1.default }),
                React.createElement(wouter_1.Route, { path: "/live", component: LiveStreams_1.default }),
                React.createElement(wouter_1.Route, { path: "/streams", component: LiveStreams_1.default }),
                React.createElement(wouter_1.Route, { path: "/profile", component: CreatorProfile_1.default }),
                React.createElement(wouter_1.Route, { path: "/content", component: Dashboard_1.default }),
                React.createElement(wouter_1.Route, { path: "/messages", component: Messages_1.default }),
                React.createElement(wouter_1.Route, { path: "/analytics", component: CreatorAnalytics_1.default }),
                React.createElement(wouter_1.Route, { path: "/creator-analytics", component: CreatorAnalytics_1.default }),
                React.createElement(wouter_1.Route, { path: "/creator-studio", component: CreatorStudio_1.default }),
                React.createElement(wouter_1.Route, { path: "/studio", component: CreatorStudio_1.default }),
                React.createElement(wouter_1.Route, { path: "/earnings", component: CreatorDashboard_1.CreatorDashboard }),
                React.createElement(wouter_1.Route, { path: "/settings", component: Settings_1.default }),
                React.createElement(wouter_1.Route, { path: "/verification", component: Verification_1.Verification }),
                React.createElement(wouter_1.Route, { path: "/moderation", component: Moderation_1.default }),
                React.createElement(wouter_1.Route, { path: "/health", component: SystemHealth_1.default }),
                React.createElement(wouter_1.Route, { path: "/money", component: FanzMoneyCenter_1.default }),
                React.createElement(wouter_1.Route, { path: "/wallet", component: FanzMoneyCenter_1.default }))),
            React.createElement(wouter_1.Route, { component: not_found_1.default }))));
}
function App() {
    return (React.createElement(react_query_1.QueryClientProvider, { client: queryClient_1.queryClient },
        React.createElement(tooltip_1.TooltipProvider, null,
            React.createElement("div", { className: "min-h-screen bg-gf-ink ghost-background" },
                React.createElement(toaster_1.Toaster, null),
                React.createElement(Router, null)))));
}
exports.default = App;
