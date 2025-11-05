"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TutorialDetailPage;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const wouter_1 = require("wouter");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const progress_1 = require("@/components/ui/progress");
const lucide_react_1 = require("lucide-react");
const useAuth_1 = require("@/hooks/useAuth");
const queryClient_1 = require("@/lib/queryClient");
function TutorialDetailPage() {
    var _a, _b, _c;
    const { user, isAuthenticated } = (0, useAuth_1.useAuth)();
    const params = (0, wouter_1.useParams)();
    const [, setLocation] = (0, wouter_1.useLocation)();
    const tutorialId = params.id;
    const [currentStep, setCurrentStep] = (0, react_1.useState)(0);
    // Fetch tutorial details
    const { data: tutorialData, isLoading: tutorialLoading } = (0, react_query_1.useQuery)({
        queryKey: ['/api/tutorials', tutorialId],
        queryFn: () => fetch(`/api/tutorials/${tutorialId}`).then(res => res.json()),
        enabled: !!tutorialId,
    });
    // Fetch tutorial steps
    const { data: stepsData, isLoading: stepsLoading } = (0, react_query_1.useQuery)({
        queryKey: ['/api/tutorials', tutorialId, 'steps'],
        queryFn: () => fetch(`/api/tutorials/${tutorialId}/steps`).then(res => res.json()),
        enabled: !!tutorialId,
    });
    // Fetch user progress (if authenticated)
    const { data: progressData } = (0, react_query_1.useQuery)({
        queryKey: ['/api/tutorials', tutorialId, 'progress'],
        queryFn: () => fetch(`/api/tutorials/${tutorialId}/progress`).then(res => res.json()),
        enabled: isAuthenticated && !!tutorialId,
    });
    // Update progress mutation
    const updateProgressMutation = (0, react_query_1.useMutation)({
        mutationFn: (stepIndex) => (0, queryClient_1.apiRequest)('PUT', `/api/tutorials/${tutorialId}/progress`, { stepIndex }),
        onSuccess: () => {
            queryClient_1.queryClient.invalidateQueries({ queryKey: ['/api/tutorials', tutorialId, 'progress'] });
        },
    });
    const tutorial = tutorialData === null || tutorialData === void 0 ? void 0 : tutorialData.tutorial;
    const steps = (stepsData === null || stepsData === void 0 ? void 0 : stepsData.steps) || [];
    const progress = progressData === null || progressData === void 0 ? void 0 : progressData.progress;
    // Set current step based on progress
    if (progress && currentStep === 0) {
        setCurrentStep(progress.completedStep);
    }
    const handleStepComplete = () => {
        if (isAuthenticated) {
            const nextStep = currentStep + 1;
            updateProgressMutation.mutate(nextStep);
            if (nextStep < steps.length) {
                setCurrentStep(nextStep);
            }
        }
        else {
            // For non-authenticated users, just move to next step locally
            if (currentStep + 1 < steps.length) {
                setCurrentStep(currentStep + 1);
            }
        }
    };
    const handlePreviousStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };
    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'beginner':
                return 'bg-green-600';
            case 'intermediate':
                return 'bg-yellow-600';
            case 'advanced':
                return 'bg-red-600';
            default:
                return 'bg-gray-600';
        }
    };
    const getRoleColor = (role) => {
        switch (role) {
            case 'creator':
                return 'text-pink-400 border-pink-600';
            case 'fan':
                return 'text-blue-400 border-blue-600';
            case 'admin':
                return 'text-purple-400 border-purple-600';
            default:
                return 'text-cyan-400 border-cyan-600';
        }
    };
    if (tutorialLoading || stepsLoading) {
        return (React.createElement("div", { className: "max-w-4xl mx-auto px-4 py-8" },
            React.createElement("div", { className: "animate-pulse space-y-6" },
                React.createElement("div", { className: "h-8 bg-gray-700 rounded w-1/3" }),
                React.createElement("div", { className: "h-4 bg-gray-700 rounded w-2/3" }),
                React.createElement("div", { className: "h-64 bg-gray-700 rounded" }))));
    }
    if (!tutorial) {
        return (React.createElement("div", { className: "max-w-4xl mx-auto px-4 py-8 text-center" },
            React.createElement("h1", { className: "text-2xl font-bold text-gf-snow mb-4" }, "Tutorial not found"),
            React.createElement(button_1.Button, { onClick: () => setLocation('/tutorials'), className: "bg-gf-gradient hover:shadow-glow-pink", "data-testid": "button-back-to-tutorials" },
                React.createElement(lucide_react_1.ArrowLeft, { className: "w-4 h-4 mr-2" }),
                "Back to Tutorials")));
    }
    const progressPercentage = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;
    const isCompleted = currentStep >= steps.length - 1;
    return (React.createElement("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" },
        React.createElement("div", { className: "mb-6 sm:mb-8" },
            React.createElement(button_1.Button, { variant: "ghost", onClick: () => setLocation('/tutorials'), className: "text-gf-smoke hover:text-gf-snow mb-4", "data-testid": "button-back-to-tutorials" },
                React.createElement(lucide_react_1.ArrowLeft, { className: "w-4 h-4 mr-2" }),
                "Back to Tutorials"),
            React.createElement("div", { className: "flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4" },
                React.createElement("div", null,
                    React.createElement("h1", { className: "font-display font-bold text-2xl sm:text-3xl text-gf-snow mb-2", "data-testid": "text-tutorial-title" }, tutorial.title),
                    React.createElement("p", { className: "text-gf-smoke text-base sm:text-lg mb-4" }, tutorial.summary),
                    React.createElement("div", { className: "flex flex-wrap items-center gap-3" },
                        React.createElement(badge_1.Badge, { variant: "outline", className: getRoleColor(tutorial.roleTarget), "data-testid": `badge-role-${tutorial.roleTarget}` },
                            React.createElement(lucide_react_1.Users, { className: "w-3 h-3 mr-1" }),
                            tutorial.roleTarget),
                        React.createElement(badge_1.Badge, { className: `${getDifficultyColor(tutorial.difficulty)} text-white`, "data-testid": `badge-difficulty-${tutorial.difficulty}` },
                            React.createElement(lucide_react_1.GraduationCap, { className: "w-3 h-3 mr-1" }),
                            tutorial.difficulty),
                        React.createElement(badge_1.Badge, { variant: "outline", className: "text-gf-smoke border-gf-smoke" },
                            React.createElement(lucide_react_1.Clock, { className: "w-3 h-3 mr-1" }),
                            tutorial.estimatedMinutes,
                            " min"))),
                React.createElement("div", { className: "glass-overlay rounded-lg p-4 w-full lg:min-w-[250px] lg:w-auto" },
                    React.createElement("div", { className: "text-center mb-3" },
                        React.createElement("div", { className: "text-2xl font-bold text-gf-pink", "data-testid": "text-progress-percentage" },
                            Math.round(progressPercentage),
                            "%"),
                        React.createElement("div", { className: "text-sm text-gf-smoke" }, "Progress")),
                    React.createElement(progress_1.Progress, { value: progressPercentage, className: "h-3 mb-2", "data-testid": "progress-bar" }),
                    React.createElement("div", { className: "text-xs text-gf-smoke text-center" },
                        "Step ",
                        currentStep + 1,
                        " of ",
                        steps.length)))),
        steps.length > 0 && (React.createElement("div", { className: "grid lg:grid-cols-4 gap-6 lg:gap-8" },
            React.createElement("div", { className: "lg:col-span-1 order-2 lg:order-1" },
                React.createElement(card_1.Card, { className: "glass-overlay border-gf-violet/30" },
                    React.createElement(card_1.CardHeader, null,
                        React.createElement(card_1.CardTitle, { className: "text-gf-snow flex items-center gap-2" },
                            React.createElement(lucide_react_1.PlayCircle, { className: "w-5 h-5 text-gf-pink" }),
                            "Tutorial Steps")),
                    React.createElement(card_1.CardContent, null,
                        React.createElement("div", { className: "space-y-2" }, steps.map((step, index) => (React.createElement("button", { key: step.id, onClick: () => setCurrentStep(index), className: `w-full text-left p-2 sm:p-3 rounded-lg transition-colors ${index === currentStep
                                ? 'bg-gf-gradient text-gf-snow'
                                : 'bg-gf-dark/30 text-gf-smoke hover:bg-gf-dark/50'}`, "data-testid": `button-step-${index + 1}` },
                            React.createElement("div", { className: "flex items-center gap-2" },
                                React.createElement("div", { className: `w-6 h-6 rounded-full flex items-center justify-center text-xs ${index <= currentStep
                                        ? 'bg-gf-pink text-white'
                                        : 'bg-gray-600 text-gray-300'}` }, index < currentStep ? (React.createElement(lucide_react_1.CheckCircle, { className: "w-4 h-4" })) : (index + 1)),
                                React.createElement("span", { className: "text-xs sm:text-sm font-medium truncate" }, step.title))))))))),
            React.createElement("div", { className: "lg:col-span-3 order-1 lg:order-2" },
                React.createElement(card_1.Card, { className: "glass-overlay border-gf-violet/30" },
                    React.createElement(card_1.CardHeader, null,
                        React.createElement("div", { className: "flex items-center justify-between" },
                            React.createElement(card_1.CardTitle, { className: "text-gf-snow text-base sm:text-lg", "data-testid": "text-current-step-title" },
                                "Step ",
                                currentStep + 1,
                                ": ", (_a = steps[currentStep]) === null || _a === void 0 ? void 0 :
                                _a.title),
                            React.createElement("div", { className: "flex items-center gap-2" },
                                currentStep > 0 && (React.createElement(button_1.Button, { variant: "outline", size: "sm", onClick: handlePreviousStep, className: "border-gf-violet text-gf-violet hover:bg-gf-violet/10", "data-testid": "button-previous-step" },
                                    React.createElement(lucide_react_1.ArrowLeft, { className: "w-4 h-4 mr-1" }),
                                    "Previous")),
                                currentStep < steps.length - 1 ? (React.createElement(button_1.Button, { size: "sm", onClick: handleStepComplete, className: "bg-gf-gradient hover:shadow-glow-pink", "data-testid": "button-complete-step" },
                                    "Complete Step",
                                    React.createElement(lucide_react_1.ArrowRight, { className: "w-4 h-4 ml-1" }))) : (React.createElement(button_1.Button, { size: "sm", onClick: handleStepComplete, className: "bg-green-600 hover:bg-green-700", "data-testid": "button-complete-tutorial" },
                                    React.createElement(lucide_react_1.CheckCircle, { className: "w-4 h-4 mr-1" }),
                                    "Complete Tutorial"))))),
                    React.createElement(card_1.CardContent, null,
                        React.createElement("div", { className: "prose prose-invert max-w-none" },
                            React.createElement("p", { className: "text-gf-smoke leading-relaxed text-lg", "data-testid": "text-step-content" }, (_b = steps[currentStep]) === null || _b === void 0 ? void 0 : _b.body),
                            ((_c = steps[currentStep]) === null || _c === void 0 ? void 0 : _c.mediaUrl) && (React.createElement("div", { className: "mt-6" },
                                React.createElement("img", { src: steps[currentStep].mediaUrl, alt: `Step ${currentStep + 1} illustration`, className: "rounded-lg shadow-lg max-w-full h-auto", "data-testid": "img-step-media" })))),
                        isCompleted && (React.createElement("div", { className: "mt-8 p-6 bg-green-600/20 border border-green-600/50 rounded-lg text-center" },
                            React.createElement(lucide_react_1.CheckCircle, { className: "w-12 h-12 text-green-400 mx-auto mb-3" }),
                            React.createElement("h3", { className: "text-xl font-bold text-green-400 mb-2" }, "Tutorial Completed!"),
                            React.createElement("p", { className: "text-gf-smoke mb-4" }, "Congratulations! You've successfully completed this tutorial."),
                            React.createElement(button_1.Button, { onClick: () => setLocation('/tutorials'), className: "bg-gf-gradient hover:shadow-glow-pink", "data-testid": "button-explore-more-tutorials" }, "Explore More Tutorials")))))))),
        steps.length === 0 && (React.createElement(card_1.Card, { className: "glass-overlay border-gf-violet/30 text-center py-12" },
            React.createElement(card_1.CardContent, null,
                React.createElement(lucide_react_1.GraduationCap, { className: "w-16 h-16 text-gf-smoke mx-auto mb-4" }),
                React.createElement("h3", { className: "text-xl font-bold text-gf-snow mb-2" }, "No Steps Available"),
                React.createElement("p", { className: "text-gf-smoke" }, "This tutorial is still being prepared. Check back soon!"))))));
}
