"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatorOnboarding = CreatorOnboarding;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const wouter_1 = require("wouter");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const textarea_1 = require("@/components/ui/textarea");
const badge_1 = require("@/components/ui/badge");
const card_1 = require("@/components/ui/card");
const use_toast_1 = require("@/hooks/use-toast");
const queryClient_1 = require("@/lib/queryClient");
const lucide_react_1 = require("lucide-react");
const steps = [
    {
        id: 1,
        title: "Welcome",
        description: "Claim Your Star Power",
        icon: lucide_react_1.Star,
    },
    {
        id: 2,
        title: "Policies",
        description: "Compliance & Guidelines",
        icon: lucide_react_1.Shield,
    },
    {
        id: 3,
        title: "Profile",
        description: "Build Your Brand",
        icon: lucide_react_1.Sparkles,
    },
    {
        id: 4,
        title: "Verification",
        description: "Secure & Verify",
        icon: lucide_react_1.Shield,
    },
    {
        id: 5,
        title: "Monetization",
        description: "Set Up Earnings",
        icon: lucide_react_1.DollarSign,
    },
    {
        id: 6,
        title: "Dashboard",
        description: "Start Creating",
        icon: lucide_react_1.TrendingUp,
    },
];
const niches = [
    "Fitness & Wellness",
    "Fashion & Style",
    "Art & Photography",
    "Gaming",
    "Music",
    "Beauty & Makeup",
    "Lifestyle",
    "Education",
    "Food & Cooking",
    "Travel",
];
function CreatorOnboarding() {
    const [, setLocation] = (0, wouter_1.useLocation)();
    const { toast } = (0, use_toast_1.useToast)();
    const [currentStep, setCurrentStep] = (0, react_1.useState)(1);
    const [formData, setFormData] = (0, react_1.useState)({
        displayName: "",
        stageName: "",
        pronouns: "",
        bio: "",
        selectedNiches: [],
        payoutMethod: "paypal",
        payoutEmail: "",
    });
    const completeOnboardingMutation = (0, react_query_1.useMutation)({
        mutationFn: async (data) => {
            const response = await (0, queryClient_1.apiRequest)("POST", "/api/creator/onboarding", data);
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Welcome to GirlFanz! 🌟",
                description: "Your creator profile is ready. Let's create!",
            });
            setLocation("/dashboard");
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to complete onboarding",
                variant: "destructive",
            });
        },
    });
    const toggleNiche = (niche) => {
        setFormData((prev) => (Object.assign(Object.assign({}, prev), { selectedNiches: prev.selectedNiches.includes(niche)
                ? prev.selectedNiches.filter((n) => n !== niche)
                : [...prev.selectedNiches, niche] })));
    };
    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (React.createElement("div", { className: "text-center space-y-6" },
                    React.createElement("div", { className: "flex justify-center" },
                        React.createElement("div", { className: "relative" },
                            React.createElement("div", { className: "absolute inset-0 bg-gradient-to-r from-gf-cyber to-gf-pink blur-xl opacity-50" }),
                            React.createElement(lucide_react_1.Star, { className: "relative h-24 w-24 text-gf-cyber" }))),
                    React.createElement("div", null,
                        React.createElement("h2", { className: "text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gf-cyber to-gf-pink bg-clip-text text-transparent mb-4" }, "Claim Your Star Power"),
                        React.createElement("p", { className: "text-gf-steel text-base sm:text-lg max-w-xl mx-auto px-4" }, "Join thousands of creators earning 100% of their revenue. You own your content. You control your earnings. Welcome to true creative freedom.")),
                    React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto px-4" },
                        React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20" },
                            React.createElement(card_1.CardContent, { className: "p-4 text-center" },
                                React.createElement(lucide_react_1.DollarSign, { className: "h-8 w-8 text-gf-cyber mx-auto mb-2" }),
                                React.createElement("p", { className: "text-sm font-semibold text-gf-snow" }, "100% Earnings"),
                                React.createElement("p", { className: "text-xs text-gf-steel mt-1" }, "Keep every penny"))),
                        React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20" },
                            React.createElement(card_1.CardContent, { className: "p-4 text-center" },
                                React.createElement(lucide_react_1.Shield, { className: "h-8 w-8 text-gf-pink mx-auto mb-2" }),
                                React.createElement("p", { className: "text-sm font-semibold text-gf-snow" }, "Content Ownership"),
                                React.createElement("p", { className: "text-xs text-gf-steel mt-1" }, "You own it all"))),
                        React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20" },
                            React.createElement(card_1.CardContent, { className: "p-4 text-center" },
                                React.createElement(lucide_react_1.TrendingUp, { className: "h-8 w-8 text-gf-cyber mx-auto mb-2" }),
                                React.createElement("p", { className: "text-sm font-semibold text-gf-snow" }, "Community Tools"),
                                React.createElement("p", { className: "text-xs text-gf-steel mt-1" }, "Grow your fanz"))))));
            case 2:
                return (React.createElement("div", { className: "space-y-6 max-w-2xl mx-auto px-4" },
                    React.createElement("div", { className: "text-center mb-6" },
                        React.createElement(lucide_react_1.Shield, { className: "h-12 w-12 sm:h-16 sm:w-16 text-gf-cyber mx-auto mb-4" }),
                        React.createElement("h2", { className: "text-xl sm:text-2xl md:text-3xl font-bold text-gf-snow mb-2" }, "Content Policies & Compliance"),
                        React.createElement("p", { className: "text-sm sm:text-base text-gf-steel" }, "Understand platform guidelines for adult content creators")),
                    React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20" },
                        React.createElement(card_1.CardContent, { className: "p-6 space-y-4" },
                            React.createElement("div", null,
                                React.createElement("h3", { className: "font-semibold text-gf-snow mb-2" }, "18 U.S.C. \u00A72257 Compliance"),
                                React.createElement("p", { className: "text-sm text-gf-steel" }, "As an adult content creator, you must maintain records proving all performers are 18+. We handle compliance documentation for you.")),
                            React.createElement("div", null,
                                React.createElement("h3", { className: "font-semibold text-gf-snow mb-2" }, "Content Guidelines"),
                                React.createElement("ul", { className: "text-sm text-gf-steel space-y-2" },
                                    React.createElement("li", null, "\u2713 All content must follow community standards"),
                                    React.createElement("li", null, "\u2713 Prohibited: minors, non-consensual content, illegal activities"),
                                    React.createElement("li", null, "\u2713 Use content warnings for sensitive material"))),
                            React.createElement("div", null,
                                React.createElement("h3", { className: "font-semibold text-gf-snow mb-2" }, "Your Rights"),
                                React.createElement("p", { className: "text-sm text-gf-steel" }, "You retain 100% ownership of your content. You can remove it anytime. We protect your intellectual property.")),
                            React.createElement("label", { className: "flex items-start gap-3 p-4 bg-gf-ink rounded-lg" },
                                React.createElement("input", { type: "checkbox", className: "mt-1 w-5 h-5 rounded border-gf-steel/20 bg-gf-charcoal focus:ring-2 focus:ring-gf-cyber", "data-testid": "checkbox-policies-agree" }),
                                React.createElement("span", { className: "text-sm text-gf-snow" }, "I understand and agree to follow all content policies and compliance requirements"))))));
            case 3:
                return (React.createElement("div", { className: "space-y-6 max-w-2xl mx-auto px-4" },
                    React.createElement("div", { className: "text-center mb-6" },
                        React.createElement("h2", { className: "text-xl sm:text-2xl md:text-3xl font-bold text-gf-snow mb-2" }, "Build Your Creator Brand"),
                        React.createElement("p", { className: "text-sm sm:text-base text-gf-steel" }, "Tell your fanz who you are")),
                    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                        React.createElement("div", null,
                            React.createElement("label", { className: "text-sm font-medium text-gf-snow mb-2 block" }, "Display Name"),
                            React.createElement(input_1.Input, { value: formData.displayName, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { displayName: e.target.value })), placeholder: "Your real or stage name", className: "bg-gf-ink border-gf-steel/20", "data-testid": "input-display-name" })),
                        React.createElement("div", null,
                            React.createElement("label", { className: "text-sm font-medium text-gf-snow mb-2 block" }, "Stage Name (Optional)"),
                            React.createElement(input_1.Input, { value: formData.stageName, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { stageName: e.target.value })), placeholder: "Your creative alias", className: "bg-gf-ink border-gf-steel/20", "data-testid": "input-stage-name" }))),
                    React.createElement("div", null,
                        React.createElement("label", { className: "text-sm font-medium text-gf-snow mb-2 block" }, "Pronouns"),
                        React.createElement(input_1.Input, { value: formData.pronouns, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { pronouns: e.target.value })), placeholder: "she/her, they/them, etc.", className: "bg-gf-ink border-gf-steel/20", "data-testid": "input-pronouns" })),
                    React.createElement("div", null,
                        React.createElement("label", { className: "text-sm font-medium text-gf-snow mb-2 block" }, "Bio"),
                        React.createElement(textarea_1.Textarea, { value: formData.bio, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { bio: e.target.value })), placeholder: "Tell your story... What makes you unique?", className: "bg-gf-ink border-gf-steel/20 min-h-[100px]", "data-testid": "input-bio" })),
                    React.createElement("div", null,
                        React.createElement("label", { className: "text-sm font-medium text-gf-snow mb-3 block" }, "Select Your Niches (Choose up to 3)"),
                        React.createElement("div", { className: "flex flex-wrap gap-2" }, niches.map((niche) => (React.createElement(badge_1.Badge, { key: niche, onClick: () => toggleNiche(niche), className: `cursor-pointer transition-all ${formData.selectedNiches.includes(niche)
                                ? "bg-gradient-to-r from-gf-cyber to-gf-pink text-white"
                                : "bg-gf-charcoal/50 border-gf-steel/20 text-gf-steel hover:border-gf-cyber"}`, "data-testid": `badge-niche-${niche.toLowerCase().replace(/\s+/g, "-")}` }, niche))))),
                    React.createElement(card_1.Card, { className: "bg-gf-charcoal/30 border-gf-cyber/20" },
                        React.createElement(card_1.CardContent, { className: "p-4 flex items-start gap-3" },
                            React.createElement(lucide_react_1.Upload, { className: "h-5 w-5 text-gf-cyber flex-shrink-0 mt-0.5" }),
                            React.createElement("div", null,
                                React.createElement("p", { className: "text-sm font-medium text-gf-snow" }, "Avatar & Banner Upload"),
                                React.createElement("p", { className: "text-xs text-gf-steel mt-1" }, "Upload your profile picture and cover banner to stand out"),
                                React.createElement(button_1.Button, { variant: "outline", size: "sm", className: "mt-2 border-gf-steel/20", "data-testid": "button-upload-media" }, "Upload Media"))))));
            case 4:
                return (React.createElement("div", { className: "space-y-6 max-w-2xl mx-auto" },
                    React.createElement("div", { className: "text-center mb-6" },
                        React.createElement(lucide_react_1.Shield, { className: "h-16 w-16 text-gf-cyber mx-auto mb-4" }),
                        React.createElement("h2", { className: "text-3xl font-bold text-gf-snow mb-2" }, "Identity Verification"),
                        React.createElement("p", { className: "text-gf-steel" }, "Quick and secure verification process")),
                    React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20" },
                        React.createElement(card_1.CardContent, { className: "p-6" },
                            React.createElement("div", { className: "space-y-4" },
                                React.createElement("div", { className: "flex items-center justify-between" },
                                    React.createElement("div", { className: "flex items-center gap-3" },
                                        React.createElement("div", { className: "h-10 w-10 rounded-full bg-gf-cyber/20 flex items-center justify-center" },
                                            React.createElement(lucide_react_1.CheckCircle, { className: "h-5 w-5 text-gf-cyber" })),
                                        React.createElement("div", null,
                                            React.createElement("p", { className: "font-medium text-gf-snow" }, "ID Verification"),
                                            React.createElement("p", { className: "text-sm text-gf-steel" }, "Upload government ID"))),
                                    React.createElement(button_1.Button, { variant: "outline", size: "sm", className: "border-gf-steel/20", "data-testid": "button-upload-id" }, "Upload")),
                                React.createElement("div", { className: "flex items-center justify-between" },
                                    React.createElement("div", { className: "flex items-center gap-3" },
                                        React.createElement("div", { className: "h-10 w-10 rounded-full bg-gf-pink/20 flex items-center justify-center" },
                                            React.createElement(lucide_react_1.Camera, { className: "h-5 w-5 text-gf-pink" })),
                                        React.createElement("div", null,
                                            React.createElement("p", { className: "font-medium text-gf-snow" }, "Selfie Match"),
                                            React.createElement("p", { className: "text-sm text-gf-steel" }, "Quick photo verification"))),
                                    React.createElement(button_1.Button, { variant: "outline", size: "sm", className: "border-gf-steel/20", "data-testid": "button-take-selfie" }, "Take Photo")),
                                React.createElement("div", { className: "flex items-center justify-between" },
                                    React.createElement("div", { className: "flex items-center gap-3" },
                                        React.createElement("div", { className: "h-10 w-10 rounded-full bg-gf-cyber/20 flex items-center justify-center" },
                                            React.createElement(lucide_react_1.Shield, { className: "h-5 w-5 text-gf-cyber" })),
                                        React.createElement("div", null,
                                            React.createElement("p", { className: "font-medium text-gf-snow" }, "Age & Consent Forms"),
                                            React.createElement("p", { className: "text-sm text-gf-steel" }, "Quick legal compliance"))),
                                    React.createElement(button_1.Button, { variant: "outline", size: "sm", className: "border-gf-steel/20", "data-testid": "button-sign-forms" }, "Sign"))),
                            React.createElement("div", { className: "mt-6 p-4 bg-gf-ink rounded-lg" },
                                React.createElement("p", { className: "text-xs text-gf-steel text-center" }, "\uD83D\uDD12 Your information is encrypted and secure. We use bank-level security to protect your data."))))));
            case 5:
                return (React.createElement("div", { className: "space-y-6 max-w-2xl mx-auto" },
                    React.createElement("div", { className: "text-center mb-6" },
                        React.createElement(lucide_react_1.DollarSign, { className: "h-16 w-16 text-gf-cyber mx-auto mb-4" }),
                        React.createElement("h2", { className: "text-3xl font-bold text-gf-snow mb-2" }, "Monetization Setup"),
                        React.createElement("p", { className: "text-gf-steel" }, "Choose how you want to get paid")),
                    React.createElement(card_1.Card, { className: "bg-gradient-to-r from-gf-cyber/10 to-gf-pink/10 border-gf-cyber/20" },
                        React.createElement(card_1.CardContent, { className: "p-6 text-center" },
                            React.createElement("p", { className: "text-lg font-semibold text-gf-snow mb-2" }, "\uD83D\uDCB0 Here's how much you'll earn"),
                            React.createElement("p", { className: "text-4xl font-bold bg-gradient-to-r from-gf-cyber to-gf-pink bg-clip-text text-transparent" }, "100% Yours"),
                            React.createElement("p", { className: "text-sm text-gf-steel mt-2" }, "No platform fees. No hidden charges. Every penny goes to you."))),
                    React.createElement("div", null,
                        React.createElement("label", { className: "text-sm font-medium text-gf-snow mb-3 block" }, "Payout Method"),
                        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3" }, ["paypal", "bank", "crypto"].map((method) => (React.createElement(card_1.Card, { key: method, onClick: () => setFormData(Object.assign(Object.assign({}, formData), { payoutMethod: method })), className: `cursor-pointer transition-all ${formData.payoutMethod === method
                                ? "bg-gf-cyber/20 border-gf-cyber"
                                : "bg-gf-charcoal/30 border-gf-steel/20 hover:border-gf-cyber/50"}`, "data-testid": `card-payout-${method}` },
                            React.createElement(card_1.CardContent, { className: "p-4 text-center" },
                                React.createElement(lucide_react_1.CreditCard, { className: "h-6 w-6 text-gf-cyber mx-auto mb-2" }),
                                React.createElement("p", { className: "text-sm font-medium text-gf-snow capitalize" }, method))))))),
                    React.createElement("div", null,
                        React.createElement("label", { className: "text-sm font-medium text-gf-snow mb-2 block" }, formData.payoutMethod === "paypal"
                            ? "PayPal Email"
                            : formData.payoutMethod === "bank"
                                ? "Bank Account"
                                : "Crypto Wallet Address"),
                        React.createElement(input_1.Input, { value: formData.payoutEmail, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { payoutEmail: e.target.value })), placeholder: formData.payoutMethod === "paypal"
                                ? "your@email.com"
                                : formData.payoutMethod === "bank"
                                    ? "Account number"
                                    : "Wallet address", className: "bg-gf-ink border-gf-steel/20", "data-testid": "input-payout-details" }))));
            case 6:
                return (React.createElement("div", { className: "text-center space-y-6" },
                    React.createElement("div", { className: "flex justify-center" },
                        React.createElement(lucide_react_1.Sparkles, { className: "h-24 w-24 text-gf-cyber animate-pulse" })),
                    React.createElement("div", null,
                        React.createElement("h2", { className: "text-4xl font-bold bg-gradient-to-r from-gf-cyber to-gf-pink bg-clip-text text-transparent mb-4" }, "You're All Set! \uD83C\uDF89"),
                        React.createElement("p", { className: "text-gf-steel text-lg max-w-xl mx-auto" }, "Your creator dashboard is ready. Start uploading content, engage with your fanz, and watch your community grow!")),
                    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto" },
                        React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20" },
                            React.createElement(card_1.CardContent, { className: "p-6 text-center" },
                                React.createElement(lucide_react_1.Upload, { className: "h-8 w-8 text-gf-cyber mx-auto mb-3" }),
                                React.createElement("p", { className: "font-semibold text-gf-snow mb-2" }, "Upload Content"),
                                React.createElement("p", { className: "text-sm text-gf-steel" }, "Share photos, videos, and go live"))),
                        React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20" },
                            React.createElement(card_1.CardContent, { className: "p-6 text-center" },
                                React.createElement(lucide_react_1.Star, { className: "h-8 w-8 text-gf-pink mx-auto mb-3" }),
                                React.createElement("p", { className: "font-semibold text-gf-snow mb-2" }, "Engage Fanz"),
                                React.createElement("p", { className: "text-sm text-gf-steel" }, "Messages, comments, and reactions"))),
                        React.createElement(card_1.Card, { className: "bg-gf-charcoal/50 border-gf-steel/20" },
                            React.createElement(card_1.CardContent, { className: "p-6 text-center" },
                                React.createElement(lucide_react_1.TrendingUp, { className: "h-8 w-8 text-gf-cyber mx-auto mb-3" }),
                                React.createElement("p", { className: "font-semibold text-gf-snow mb-2" }, "Track Analytics"),
                                React.createElement("p", { className: "text-sm text-gf-steel" }, "See your growth and earnings")))),
                    React.createElement(button_1.Button, { onClick: () => completeOnboardingMutation.mutate(formData), disabled: completeOnboardingMutation.isPending, className: "bg-gradient-to-r from-gf-cyber to-gf-pink hover:opacity-90 text-lg px-8 py-6", "data-testid": "button-complete-onboarding" }, completeOnboardingMutation.isPending ? ("Setting up...") : (React.createElement(React.Fragment, null,
                        React.createElement(lucide_react_1.Sparkles, { className: "h-5 w-5 mr-2" }),
                        "Enter Your Dashboard")))));
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
                                ? "bg-gradient-to-r from-gf-cyber to-gf-pink border-gf-cyber"
                                : "bg-gf-charcoal border-gf-steel/20"}` },
                            React.createElement(step.icon, { className: "h-6 w-6" })),
                        React.createElement("p", { className: `text-xs mt-2 font-medium ${currentStep >= step.id ? "text-gf-cyber" : "text-gf-steel"}` }, step.title)),
                    index < steps.length - 1 && (React.createElement("div", { className: `h-0.5 flex-1 mx-2 transition-all ${currentStep > step.id ? "bg-gf-cyber" : "bg-gf-steel/20"}` }))))))),
            React.createElement("div", { className: "mb-8" }, renderStep()),
            currentStep !== 6 && (React.createElement("div", { className: "flex justify-between max-w-2xl mx-auto" },
                React.createElement(button_1.Button, { variant: "outline", onClick: () => setCurrentStep((prev) => Math.max(1, prev - 1)), disabled: currentStep === 1, className: "border-gf-steel/20", "data-testid": "button-previous" }, "Previous"),
                React.createElement(button_1.Button, { onClick: () => setCurrentStep((prev) => Math.min(6, prev + 1)), className: "bg-gradient-to-r from-gf-cyber to-gf-pink hover:opacity-90", "data-testid": "button-next" }, currentStep === 5 ? "Complete Setup" : "Next"))))));
}
