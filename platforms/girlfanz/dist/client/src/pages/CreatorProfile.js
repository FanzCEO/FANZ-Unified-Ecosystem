"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CreatorProfile;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const textarea_1 = require("@/components/ui/textarea");
const tabs_1 = require("@/components/ui/tabs");
const Sidebar_1 = require("@/components/layout/Sidebar");
const ObjectUploader_1 = require("@/components/ObjectUploader");
const queryClient_1 = require("@/lib/queryClient");
const use_toast_1 = require("@/hooks/use-toast");
const lucide_react_1 = require("lucide-react");
function CreatorProfile() {
    const { toast } = (0, use_toast_1.useToast)();
    const queryClient = (0, react_query_1.useQueryClient)();
    const [profileData, setProfileData] = (0, react_1.useState)({
        displayName: "",
        bio: "",
        subscriptionPrice: 0,
    });
    const { data: profile, isLoading } = (0, react_query_1.useQuery)({
        queryKey: ["/api/profile"],
        select: (data) => {
            // Initialize form data when profile loads
            if (data && !profileData.displayName) {
                setProfileData({
                    displayName: data.displayName || "",
                    bio: data.bio || "",
                    subscriptionPrice: data.subscriptionPrice ? data.subscriptionPrice / 100 : 0,
                });
            }
            return data;
        },
    });
    const updateProfileMutation = (0, react_query_1.useMutation)({
        mutationFn: async (data) => {
            const response = await (0, queryClient_1.apiRequest)("POST", "/api/profile", data);
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Profile updated successfully!",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to update profile.",
                variant: "destructive",
            });
        },
    });
    const handleSaveProfile = () => {
        updateProfileMutation.mutate(Object.assign(Object.assign({}, profileData), { subscriptionPrice: Math.round(profileData.subscriptionPrice * 100) }));
    };
    const handleGetUploadParameters = async () => {
        const response = await (0, queryClient_1.apiRequest)("POST", "/api/objects/upload", {});
        const data = await response.json();
        return {
            method: "PUT",
            url: data.uploadURL,
        };
    };
    const handleAvatarUpload = async (result) => {
        if (result.successful.length > 0) {
            const uploadedFile = result.successful[0];
            // TODO: Update profile with new avatar URL
            toast({
                title: "Success",
                description: "Avatar updated successfully!",
            });
        }
    };
    const handleBannerUpload = async (result) => {
        if (result.successful.length > 0) {
            const uploadedFile = result.successful[0];
            // TODO: Update profile with new banner URL
            toast({
                title: "Success",
                description: "Banner updated successfully!",
            });
        }
    };
    if (isLoading) {
        return (React.createElement("div", { className: "min-h-screen bg-gf-ink text-gf-snow flex items-center justify-center" },
            React.createElement("div", { className: "text-xl" }, "Loading profile...")));
    }
    return (React.createElement("div", { className: "min-h-screen bg-gf-ink text-gf-snow" },
        React.createElement("section", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" },
            React.createElement("div", { className: "grid lg:grid-cols-4 gap-8" },
                React.createElement("div", { className: "lg:col-span-1" },
                    React.createElement(Sidebar_1.Sidebar, null)),
                React.createElement("div", { className: "lg:col-span-3" },
                    React.createElement(tabs_1.Tabs, { defaultValue: "profile", className: "space-y-8" },
                        React.createElement(tabs_1.TabsList, { className: "grid w-full grid-cols-3 bg-gf-graphite text-xs sm:text-sm" },
                            React.createElement(tabs_1.TabsTrigger, { value: "profile", className: "data-[state=active]:bg-gf-pink" }, "Profile"),
                            React.createElement(tabs_1.TabsTrigger, { value: "verification", className: "data-[state=active]:bg-gf-pink" }, "Verification"),
                            React.createElement(tabs_1.TabsTrigger, { value: "payouts", className: "data-[state=active]:bg-gf-pink" }, "Payouts")),
                        React.createElement(tabs_1.TabsContent, { value: "profile", className: "space-y-8" },
                            React.createElement(card_1.Card, { className: "glass-overlay border-gf-smoke/20" },
                                React.createElement(card_1.CardContent, { className: "p-0" },
                                    React.createElement("div", { className: "relative" },
                                        React.createElement("div", { className: "h-32 sm:h-40 md:h-48 bg-gradient-to-r from-gf-pink/20 to-gf-violet/20 rounded-t-lg flex items-center justify-center" }, (profile === null || profile === void 0 ? void 0 : profile.bannerUrl) ? (React.createElement("img", { src: profile.bannerUrl, alt: "Profile banner", className: "w-full h-full object-cover rounded-t-lg" })) : (React.createElement("div", { className: "text-gf-smoke text-center" },
                                            React.createElement(lucide_react_1.Camera, { className: "h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-2" }),
                                            React.createElement("p", null, "Upload a banner image")))),
                                        React.createElement("div", { className: "absolute top-2 right-2 sm:top-4 sm:right-4" },
                                            React.createElement(ObjectUploader_1.ObjectUploader, { maxNumberOfFiles: 1, maxFileSize: 10 * 1024 * 1024, onGetUploadParameters: handleGetUploadParameters, onComplete: handleBannerUpload, buttonClassName: "bg-gf-graphite/80 text-gf-snow border border-gf-smoke/20 hover:bg-gf-graphite" },
                                                React.createElement(lucide_react_1.Camera, { className: "h-4 w-4 mr-2" }),
                                                "Change Banner")),
                                        React.createElement("div", { className: "absolute -bottom-12 sm:-bottom-16 left-4 sm:left-8" },
                                            React.createElement("div", { className: "relative" },
                                                React.createElement("img", { src: (profile === null || profile === void 0 ? void 0 : profile.avatarUrl) || "/api/placeholder/128/128", alt: "Profile avatar", className: "w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-2 sm:border-4 border-gf-graphite", "data-testid": "img-profile-avatar" }),
                                                React.createElement("div", { className: "absolute bottom-2 right-2" },
                                                    React.createElement(ObjectUploader_1.ObjectUploader, { maxNumberOfFiles: 1, maxFileSize: 5 * 1024 * 1024, onGetUploadParameters: handleGetUploadParameters, onComplete: handleAvatarUpload, buttonClassName: "bg-gf-pink text-gf-snow p-2 rounded-full hover:bg-gf-pink/80" },
                                                        React.createElement(lucide_react_1.Camera, { className: "h-4 w-4" })))))),
                                    React.createElement("div", { className: "pt-16 sm:pt-20 p-4 sm:p-6 md:p-8" },
                                        React.createElement("div", { className: "space-y-6" },
                                            React.createElement("div", { className: "grid md:grid-cols-2 gap-6" },
                                                React.createElement("div", { className: "space-y-2" },
                                                    React.createElement(label_1.Label, { htmlFor: "displayName", className: "text-gf-smoke" }, "Display Name"),
                                                    React.createElement(input_1.Input, { id: "displayName", value: profileData.displayName, onChange: (e) => setProfileData(Object.assign(Object.assign({}, profileData), { displayName: e.target.value })), className: "bg-gf-graphite border-gf-smoke/20 text-gf-snow focus:border-gf-pink", placeholder: "Your display name", "data-testid": "input-display-name" })),
                                                React.createElement("div", { className: "space-y-2" },
                                                    React.createElement(label_1.Label, { htmlFor: "subscriptionPrice", className: "text-gf-smoke" }, "Monthly Subscription Price"),
                                                    React.createElement("div", { className: "relative" },
                                                        React.createElement("span", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gf-smoke" }, "$"),
                                                        React.createElement(input_1.Input, { id: "subscriptionPrice", type: "number", step: "0.01", min: "0", value: profileData.subscriptionPrice, onChange: (e) => setProfileData(Object.assign(Object.assign({}, profileData), { subscriptionPrice: parseFloat(e.target.value) || 0 })), className: "bg-gf-graphite border-gf-smoke/20 text-gf-snow focus:border-gf-pink pl-8", placeholder: "0.00", "data-testid": "input-subscription-price" })))),
                                            React.createElement("div", { className: "space-y-2" },
                                                React.createElement(label_1.Label, { htmlFor: "bio", className: "text-gf-smoke" }, "Bio"),
                                                React.createElement(textarea_1.Textarea, { id: "bio", value: profileData.bio, onChange: (e) => setProfileData(Object.assign(Object.assign({}, profileData), { bio: e.target.value })), className: "bg-gf-graphite border-gf-smoke/20 text-gf-snow focus:border-gf-pink resize-none h-32", placeholder: "Tell your fans about yourself...", "data-testid": "textarea-bio" })),
                                            React.createElement(button_1.Button, { onClick: handleSaveProfile, disabled: updateProfileMutation.isPending, className: "bg-gf-gradient text-gf-snow hover:shadow-glow-pink", "data-testid": "button-save-profile" }, updateProfileMutation.isPending ? "Saving..." : "Save Profile")))))),
                        React.createElement(tabs_1.TabsContent, { value: "verification", className: "space-y-8" },
                            React.createElement(card_1.Card, { className: "glass-overlay border-gf-smoke/20" },
                                React.createElement(card_1.CardHeader, null,
                                    React.createElement(card_1.CardTitle, { className: "flex items-center text-gf-snow" },
                                        React.createElement(lucide_react_1.Shield, { className: "h-6 w-6 mr-2 text-gf-violet" }),
                                        "Age & Identity Verification")),
                                React.createElement(card_1.CardContent, { className: "space-y-6" },
                                    React.createElement("div", { className: "bg-gf-violet/10 border border-gf-violet/20 rounded-lg p-6" },
                                        React.createElement("h3", { className: "font-semibold text-gf-snow mb-2" }, "Verification Status"),
                                        React.createElement("div", { className: "flex items-center space-x-2 mb-4" },
                                            React.createElement("div", { className: `w-3 h-3 rounded-full ${(profile === null || profile === void 0 ? void 0 : profile.kycStatus) === 'verified' ? 'bg-success' : 'bg-warning'}` }),
                                            React.createElement("span", { className: "text-gf-snow capitalize" }, (profile === null || profile === void 0 ? void 0 : profile.kycStatus) || 'Pending')),
                                        React.createElement("p", { className: "text-gf-smoke text-sm" }, "Verification is required for creator accounts to comply with 18 U.S.C. \u00A72257 regulations. Please upload a government-issued ID to complete verification.")),
                                    (profile === null || profile === void 0 ? void 0 : profile.kycStatus) !== 'verified' && (React.createElement("div", { className: "space-y-4" },
                                        React.createElement("h3", { className: "font-semibold text-gf-snow" }, "Upload Verification Documents"),
                                        React.createElement(ObjectUploader_1.ObjectUploader, { maxNumberOfFiles: 2, maxFileSize: 10 * 1024 * 1024, onGetUploadParameters: handleGetUploadParameters, onComplete: (result) => {
                                                toast({
                                                    title: "Documents Uploaded",
                                                    description: "Your verification documents have been submitted for review.",
                                                });
                                            }, buttonClassName: "bg-gf-violet text-gf-snow hover:bg-gf-violet/80" }, "Upload ID Documents"),
                                        React.createElement("p", { className: "text-xs text-gf-smoke" }, "Accepted: Driver's License, Passport, State ID. Processing typically takes 24-48 hours.")))))),
                        React.createElement(tabs_1.TabsContent, { value: "payouts", className: "space-y-8" },
                            React.createElement(card_1.Card, { className: "glass-overlay border-gf-smoke/20" },
                                React.createElement(card_1.CardHeader, null,
                                    React.createElement(card_1.CardTitle, { className: "flex items-center text-gf-snow" },
                                        React.createElement(lucide_react_1.CreditCard, { className: "h-6 w-6 mr-2 text-success" }),
                                        "Payout Settings")),
                                React.createElement(card_1.CardContent, { className: "space-y-6" },
                                    React.createElement("div", { className: "bg-success/10 border border-success/20 rounded-lg p-6" },
                                        React.createElement("h3", { className: "font-semibold text-gf-snow mb-2" }, "Adult-Friendly Payment Processors"),
                                        React.createElement("p", { className: "text-gf-smoke text-sm mb-4" }, "We only work with payment processors that support adult content creators."),
                                        React.createElement("div", { className: "grid md:grid-cols-3 gap-4" },
                                            React.createElement("div", { className: "bg-gf-graphite rounded-lg p-4 text-center" },
                                                React.createElement("div", { className: "font-semibold text-gf-snow" }, "Paxum"),
                                                React.createElement("div", { className: "text-xs text-gf-smoke" }, "Primary Option")),
                                            React.createElement("div", { className: "bg-gf-graphite rounded-lg p-4 text-center" },
                                                React.createElement("div", { className: "font-semibold text-gf-snow" }, "ePayService"),
                                                React.createElement("div", { className: "text-xs text-gf-smoke" }, "Alternative")),
                                            React.createElement("div", { className: "bg-gf-graphite rounded-lg p-4 text-center" },
                                                React.createElement("div", { className: "font-semibold text-gf-snow" }, "Crypto"),
                                                React.createElement("div", { className: "text-xs text-gf-smoke" }, "BTC/ETH/USDT")))),
                                    React.createElement("div", { className: "space-y-4" },
                                        React.createElement("h3", { className: "font-semibold text-gf-snow" }, "Add Payout Method"),
                                        React.createElement(button_1.Button, { className: "bg-gf-gradient text-gf-snow hover:shadow-glow-pink", "data-testid": "button-add-payout-method" }, "Connect Paxum Account"),
                                        React.createElement("p", { className: "text-xs text-gf-smoke" }, "Minimum payout: $20. Processing time: 1-3 business days.")))))))))));
}
