"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FanzOnboarding = FanzOnboarding;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const wouter_1 = require("wouter");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const badge_1 = require("@/components/ui/badge");
const card_1 = require("@/components/ui/card");
const use_toast_1 = require("@/hooks/use-toast");
const queryClient_1 = require("@/lib/queryClient");
const lucide_react_1 = require("lucide-react");
const steps = [
    {
        id: 1,
        title: "Welcome",
        description: "Discover Creators",
        icon: lucide_react_1.Sparkles,
    },
    {
        id: 2,
        title: "Account",
        description: "Create Account",
        icon: lucide_react_1.Heart,
    },
    {
        id: 3,
        title: "Personalize",
        description: "Find Your Vibe",
        icon: lucide_react_1.TrendingUp,
    },
    {
        id: 4,
        title: "Payment",
        description: "Quick Setup",
        icon: lucide_react_1.CreditCard,
    },
    {
        id: 5,
        title: "Dashboard",
        description: "Start Exploring",
        icon: lucide_react_1.MessageCircle,
    },
];
const interests = [
    { name: "Fitness", emoji: "💪" },
    { name: "Fashion", emoji: "👗" },
    { name: "Art", emoji: "🎨" },
    { name: "Gaming", emoji: "🎮" },
    { name: "Music", emoji: "🎵" },
    { name: "Beauty", emoji: "💄" },
    { name: "Lifestyle", emoji: "✨" },
    { name: "Food", emoji: "🍕" },
    { name: "Travel", emoji: "✈️" },
    { name: "Wellness", emoji: "🧘" },
];
function FanzOnboarding() {
    const [, setLocation] = (0, wouter_1.useLocation)();
    const { toast } = (0, use_toast_1.useToast)();
    const [currentStep, setCurrentStep] = (0, react_1.useState)(1);
    const [formData, setFormData] = (0, react_1.useState)({
        birthday: "",
        selectedInterests: [],
        paymentAdded: false,
    });
    const completeOnboardingMutation = (0, react_query_1.useMutation)({
        mutationFn: async (data) => {
            const response = await (0, queryClient_1.apiRequest)("POST", "/api/fan/onboarding", data);
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Welcome to GirlFanz! 🎉",
                description: "Your personalized feed is ready. Start discovering!",
            });
            setLocation("/feed");
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to complete onboarding",
                variant: "destructive",
            });
        },
    });
    const toggleInterest = (interest) => {
        setFormData((prev) => (Object.assign(Object.assign({}, prev), { selectedInterests: prev.selectedInterests.includes(interest)
                ? prev.selectedInterests.filter((i) => i !== interest)
                : [...prev.selectedInterests, interest] })));
    };
    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (React.createElement("div", { className: "text-center space-y-6" },
                    React.createElement("div", { className: "flex justify-center" },
                        React.createElement("div", { className: "relative" },
                            React.createElement("div", { className: "absolute inset-0 bg-gradient-to-r from-gf-cyber to-gf-pink blur-xl opacity-50" }),
                            React.createElement(lucide_react_1.Sparkles, { className: "relative h-24 w-24 text-gf-pink" }))),
                    React.createElement("div", null,
                        React.createElement("h2", { className: "text-4xl font-bold bg-gradient-to-r from-gf-cyber to-gf-pink bg-clip-text text-transparent mb-4" }, "Discover. Connect. Support."),
                        React.createElement("p", { className: "text-gf-steel text-lg max-w-xl mx-auto" }, "Your new world of creators awaits. Find exclusive content, connect with your favorite stars, and support the creators you love.")),
                    React.createElement("div", { className: "grid grid-cols-3 gap-4 max-w-3xl mx-auto" }, [1, 2, 3, 4, 5, 6].map((i) => (React.createElement("div", { key: i, className: "relative h-32 bg-gradient-to-br from-gf-cyber/20 to-gf-pink/20 rounded-lg overflow-hidden" },
                        React.createElement("div", { className: "absolute inset-0 backdrop-blur-xl bg-black/40 flex items-center justify-center" },
                            React.createElement("p", { className: "text-gf-snow text-xs font-semibold" }, "Sign up to see")))))),
                    React.createElement("div", { className: "grid grid-cols-3 gap-4 max-w-2xl mx-auto" },
                        React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20" },
                            React.createElement(card_1.CardContent, { className: "p-4 text-center" },
                                React.createElement(lucide_react_1.Heart, { className: "h-8 w-8 text-gf-pink mx-auto mb-2" }),
                                React.createElement("p", { className: "text-sm font-semibold text-gf-snow" }, "Follow Stars"),
                                React.createElement("p", { className: "text-xs text-gf-steel mt-1" }, "Your faves, your feed"))),
                        React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20" },
                            React.createElement(card_1.CardContent, { className: "p-4 text-center" },
                                React.createElement(lucide_react_1.MessageCircle, { className: "h-8 w-8 text-gf-cyber mx-auto mb-2" }),
                                React.createElement("p", { className: "text-sm font-semibold text-gf-snow" }, "Direct Access"),
                                React.createElement("p", { className: "text-xs text-gf-steel mt-1" }, "Message creators"))),
                        React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20" },
                            React.createElement(card_1.CardContent, { className: "p-4 text-center" },
                                React.createElement(lucide_react_1.Gift, { className: "h-8 w-8 text-gf-pink mx-auto mb-2" }),
                                React.createElement("p", { className: "text-sm font-semibold text-gf-snow" }, "Show Support"),
                                React.createElement("p", { className: "text-xs text-gf-steel mt-1" }, "Tips & subscriptions"))))));
            case 2:
                return (React.createElement("div", { className: "space-y-6 max-w-lg mx-auto" },
                    React.createElement("div", { className: "text-center mb-6" },
                        React.createElement("h2", { className: "text-3xl font-bold text-gf-snow mb-2" }, "Create Your Account"),
                        React.createElement("p", { className: "text-gf-steel" }, "Quick and easy sign up")),
                    React.createElement("div", { className: "space-y-4" },
                        React.createElement("div", null,
                            React.createElement("label", { className: "text-sm font-medium text-gf-snow mb-2 block" }, "Birthday (Age Verification)"),
                            React.createElement(input_1.Input, { type: "date", value: formData.birthday, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { birthday: e.target.value })), className: "bg-gf-ink border-gf-steel/20", "data-testid": "input-birthday" }),
                            React.createElement("p", { className: "text-xs text-gf-steel mt-1" }, "You must be 18+ to join GirlFanz")),
                        React.createElement(card_1.Card, { className: "bg-gf-charcoal/30 border-gf-cyber/20" },
                            React.createElement(card_1.CardContent, { className: "p-4" },
                                React.createElement("p", { className: "text-sm font-medium text-gf-snow mb-3" }, "Or sign up with"),
                                React.createElement("div", { className: "space-y-2" },
                                    React.createElement(button_1.Button, { variant: "outline", className: "w-full border-gf-steel/20", "data-testid": "button-google-signup" },
                                        React.createElement("svg", { className: "h-5 w-5 mr-2", viewBox: "0 0 24 24" },
                                            React.createElement("path", { fill: "currentColor", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }),
                                            React.createElement("path", { fill: "currentColor", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }),
                                            React.createElement("path", { fill: "currentColor", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }),
                                            React.createElement("path", { fill: "currentColor", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })),
                                        "Continue with Google"),
                                    React.createElement(button_1.Button, { variant: "outline", className: "w-full border-gf-steel/20", "data-testid": "button-apple-signup" },
                                        React.createElement("svg", { className: "h-5 w-5 mr-2", viewBox: "0 0 24 24", fill: "currentColor" },
                                            React.createElement("path", { d: "M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" })),
                                        "Continue with Apple")))),
                        React.createElement("div", { className: "text-center" },
                            React.createElement("p", { className: "text-xs text-gf-steel" },
                                "By signing up, you agree to our",
                                " ",
                                React.createElement("a", { href: "/terms", className: "text-gf-cyber hover:underline" }, "Terms of Service"),
                                " ",
                                "and",
                                " ",
                                React.createElement("a", { href: "/privacy", className: "text-gf-cyber hover:underline" }, "Privacy Policy"))))));
            case 3:
                return (React.createElement("div", { className: "space-y-6 max-w-2xl mx-auto" },
                    React.createElement("div", { className: "text-center mb-6" },
                        React.createElement(lucide_react_1.TrendingUp, { className: "h-16 w-16 text-gf-cyber mx-auto mb-4" }),
                        React.createElement("h2", { className: "text-3xl font-bold text-gf-snow mb-2" }, "Personalize Your Feed"),
                        React.createElement("p", { className: "text-gf-steel" }, "Pick your interests to discover creators you'll love")),
                    React.createElement("div", null,
                        React.createElement("label", { className: "text-sm font-medium text-gf-snow mb-3 block" }, "What are you interested in?"),
                        React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-3" }, interests.map((interest) => (React.createElement(card_1.Card, { key: interest.name, onClick: () => toggleInterest(interest.name), className: `cursor-pointer transition-all ${formData.selectedInterests.includes(interest.name)
                                ? "bg-gradient-to-r from-gf-cyber to-gf-pink border-gf-cyber"
                                : "bg-gf-charcoal/30 border-gf-steel/20 hover:border-gf-cyber/50"}`, "data-testid": `card-interest-${interest.name.toLowerCase()}` },
                            React.createElement(card_1.CardContent, { className: "p-4 text-center" },
                                React.createElement("div", { className: "text-3xl mb-2" }, interest.emoji),
                                React.createElement("p", { className: "text-sm font-medium text-gf-snow" }, interest.name))))))),
                    formData.selectedInterests.length > 0 && (React.createElement(card_1.Card, { className: "bg-gf-charcoal/30 border-gf-cyber/20" },
                        React.createElement(card_1.CardContent, { className: "p-4" },
                            React.createElement("p", { className: "text-sm font-medium text-gf-snow mb-2" },
                                "Selected Interests (",
                                formData.selectedInterests.length,
                                ")"),
                            React.createElement("div", { className: "flex flex-wrap gap-2" }, formData.selectedInterests.map((interest) => (React.createElement(badge_1.Badge, { key: interest, className: "bg-gradient-to-r from-gf-cyber to-gf-pink" }, interest)))))))));
            case 4:
                return (React.createElement("div", { className: "space-y-6 max-w-lg mx-auto" },
                    React.createElement("div", { className: "text-center mb-6" },
                        React.createElement(lucide_react_1.CreditCard, { className: "h-16 w-16 text-gf-cyber mx-auto mb-4" }),
                        React.createElement("h2", { className: "text-3xl font-bold text-gf-snow mb-2" }, "Payment Setup"),
                        React.createElement("p", { className: "text-gf-steel" }, "Optional - Add payment for instant tips & subs")),
                    React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20" },
                        React.createElement(card_1.CardContent, { className: "p-6 space-y-4" },
                            React.createElement("div", { className: "flex items-center gap-3" },
                                React.createElement(lucide_react_1.Shield, { className: "h-10 w-10 text-gf-cyber flex-shrink-0" }),
                                React.createElement("div", null,
                                    React.createElement("p", { className: "font-medium text-gf-snow" }, "100% Secure Payments"),
                                    React.createElement("p", { className: "text-sm text-gf-steel" }, "Bank-level encryption. Your data is safe."))),
                            React.createElement("div", { className: "space-y-3" },
                                React.createElement(button_1.Button, { variant: "outline", className: "w-full border-gf-steel/20 justify-start", "data-testid": "button-add-card" },
                                    React.createElement(lucide_react_1.CreditCard, { className: "h-5 w-5 mr-3" }),
                                    "Add Credit/Debit Card"),
                                React.createElement(button_1.Button, { variant: "outline", className: "w-full border-gf-steel/20 justify-start", "data-testid": "button-add-paypal" },
                                    React.createElement("svg", { className: "h-5 w-5 mr-3", viewBox: "0 0 24 24", fill: "currentColor" },
                                        React.createElement("path", { d: "M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" })),
                                    "Add PayPal")),
                            React.createElement("div", { className: "text-center pt-2" },
                                React.createElement(button_1.Button, { variant: "ghost", onClick: () => setCurrentStep(5), className: "text-gf-steel hover:text-gf-snow", "data-testid": "button-skip-payment" }, "Skip for now")))),
                    React.createElement("div", { className: "bg-gf-charcoal/30 rounded-lg p-4" },
                        React.createElement("p", { className: "text-xs text-gf-steel text-center" }, "\uD83D\uDCA1 Add payment now to tip creators instantly and unlock exclusive content"))));
            case 5:
                return (React.createElement("div", { className: "text-center space-y-6" },
                    React.createElement("div", { className: "flex justify-center" },
                        React.createElement(lucide_react_1.Heart, { className: "h-24 w-24 text-gf-pink animate-pulse" })),
                    React.createElement("div", null,
                        React.createElement("h2", { className: "text-4xl font-bold bg-gradient-to-r from-gf-cyber to-gf-pink bg-clip-text text-transparent mb-4" }, "Welcome to the Community! \uD83C\uDF89"),
                        React.createElement("p", { className: "text-gf-steel text-lg max-w-xl mx-auto" }, "Your personalized feed is ready. Discover creators, engage with content, and be part of something special.")),
                    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto" },
                        React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20" },
                            React.createElement(card_1.CardContent, { className: "p-6 text-center" },
                                React.createElement(lucide_react_1.Sparkles, { className: "h-8 w-8 text-gf-cyber mx-auto mb-3" }),
                                React.createElement("p", { className: "font-semibold text-gf-snow mb-2" }, "Discover Feed"),
                                React.createElement("p", { className: "text-sm text-gf-steel" }, "Personalized content just for you"))),
                        React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20" },
                            React.createElement(card_1.CardContent, { className: "p-6 text-center" },
                                React.createElement(lucide_react_1.MessageCircle, { className: "h-8 w-8 text-gf-pink mx-auto mb-3" }),
                                React.createElement("p", { className: "font-semibold text-gf-snow mb-2" }, "Direct Messages"),
                                React.createElement("p", { className: "text-sm text-gf-steel" }, "Connect with your favorite stars"))),
                        React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20" },
                            React.createElement(card_1.CardContent, { className: "p-6 text-center" },
                                React.createElement(lucide_react_1.Calendar, { className: "h-8 w-8 text-gf-cyber mx-auto mb-3" }),
                                React.createElement("p", { className: "font-semibold text-gf-snow mb-2" }, "Live Events"),
                                React.createElement("p", { className: "text-sm text-gf-steel" }, "Join exclusive live streams")))),
                    React.createElement(button_1.Button, { onClick: () => completeOnboardingMutation.mutate(formData), disabled: completeOnboardingMutation.isPending, className: "bg-gradient-to-r from-gf-cyber to-gf-pink hover:opacity-90 text-lg px-8 py-6", "data-testid": "button-complete-onboarding" }, completeOnboardingMutation.isPending ? ("Setting up...") : (React.createElement(React.Fragment, null,
                        React.createElement(lucide_react_1.Sparkles, { className: "h-5 w-5 mr-2" }),
                        "Start Exploring")))));
            default:
                return null;
        }
    };
    return (React.createElement("div", { className: "min-h-screen bg-gf-ink text-gf-snow p-6" },
        React.createElement("div", { className: "max-w-6xl mx-auto" },
            React.createElement("div", { className: "mb-12" },
                React.createElement("div", { className: "flex items-center justify-between" }, steps.map((step, index) => (React.createElement("div", { key: step.id, className: "flex items-center flex-1" },
                    React.createElement("div", { className: "flex flex-col items-center flex-1" },
                        React.createElement("div", { className: `relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${currentStep >= step.id
                                ? "bg-gradient-to-r from-gf-cyber to-gf-pink border-gf-pink"
                                : "bg-gf-charcoal border-gf-steel/20"}` },
                            React.createElement(step.icon, { className: "h-6 w-6" })),
                        React.createElement("p", { className: `text-xs mt-2 font-medium ${currentStep >= step.id ? "text-gf-pink" : "text-gf-steel"}` }, step.title)),
                    index < steps.length - 1 && (React.createElement("div", { className: `h-0.5 flex-1 mx-2 transition-all ${currentStep > step.id ? "bg-gf-pink" : "bg-gf-steel/20"}` }))))))),
            React.createElement("div", { className: "mb-8" }, renderStep()),
            currentStep !== 5 && (React.createElement("div", { className: "flex justify-between max-w-2xl mx-auto" },
                React.createElement(button_1.Button, { variant: "outline", onClick: () => setCurrentStep((prev) => Math.max(1, prev - 1)), disabled: currentStep === 1, className: "border-gf-steel/20", "data-testid": "button-previous" }, "Previous"),
                React.createElement(button_1.Button, { onClick: () => setCurrentStep((prev) => Math.min(5, prev + 1)), className: "bg-gradient-to-r from-gf-cyber to-gf-pink hover:opacity-90", "data-testid": "button-next" }, currentStep === 4 ? "Skip & Continue" : "Next"))))));
}
