"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Settings;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const switch_1 = require("@/components/ui/switch");
const tabs_1 = require("@/components/ui/tabs");
const Sidebar_1 = require("@/components/layout/Sidebar");
const queryClient_1 = require("@/lib/queryClient");
const use_toast_1 = require("@/hooks/use-toast");
const useAuth_1 = require("@/hooks/useAuth");
const authUtils_1 = require("@/lib/authUtils");
const lucide_react_1 = require("lucide-react");
function Settings() {
    const { user } = (0, useAuth_1.useAuth)();
    const { toast } = (0, use_toast_1.useToast)();
    const queryClient = (0, react_query_1.useQueryClient)();
    const [settings, setSettings] = (0, react_1.useState)({
        notifications: {
            newMessages: true,
            newFollowers: true,
            tips: true,
            marketing: false,
        },
        privacy: {
            showOnlineStatus: true,
            allowDirectMessages: true,
            profileVisible: true,
        },
        security: {
            twoFactorEnabled: false,
            loginNotifications: true,
        },
    });
    const [passwordData, setPasswordData] = (0, react_1.useState)({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const updateSettingsMutation = (0, react_query_1.useMutation)({
        mutationFn: async (data) => {
            const response = await (0, queryClient_1.apiRequest)("PUT", "/api/settings", data);
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Settings updated successfully!",
            });
        },
        onError: (error) => {
            if ((0, authUtils_1.isUnauthorizedError)(error)) {
                toast({
                    title: "Unauthorized",
                    description: "You are logged out. Logging in again...",
                    variant: "destructive",
                });
                setTimeout(() => {
                    window.location.href = "/api/login";
                }, 500);
                return;
            }
            toast({
                title: "Error",
                description: "Failed to update settings.",
                variant: "destructive",
            });
        },
    });
    const changePasswordMutation = (0, react_query_1.useMutation)({
        mutationFn: async (data) => {
            const response = await (0, queryClient_1.apiRequest)("PUT", "/api/auth/password", data);
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Password changed successfully!",
            });
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        },
        onError: (error) => {
            if ((0, authUtils_1.isUnauthorizedError)(error)) {
                toast({
                    title: "Unauthorized",
                    description: "You are logged out. Logging in again...",
                    variant: "destructive",
                });
                setTimeout(() => {
                    window.location.href = "/api/login";
                }, 500);
                return;
            }
            toast({
                title: "Error",
                description: "Failed to change password.",
                variant: "destructive",
            });
        },
    });
    const deleteAccountMutation = (0, react_query_1.useMutation)({
        mutationFn: async () => {
            const response = await (0, queryClient_1.apiRequest)("DELETE", "/api/auth/account", {});
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Account Deleted",
                description: "Your account has been permanently deleted.",
            });
            window.location.href = "/";
        },
        onError: (error) => {
            if ((0, authUtils_1.isUnauthorizedError)(error)) {
                toast({
                    title: "Unauthorized",
                    description: "You are logged out. Logging in again...",
                    variant: "destructive",
                });
                setTimeout(() => {
                    window.location.href = "/api/login";
                }, 500);
                return;
            }
            toast({
                title: "Error",
                description: "Failed to delete account.",
                variant: "destructive",
            });
        },
    });
    const handleSaveSettings = () => {
        updateSettingsMutation.mutate(settings);
    };
    const handleChangePassword = () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast({
                title: "Error",
                description: "New passwords do not match.",
                variant: "destructive",
            });
            return;
        }
        if (passwordData.newPassword.length < 8) {
            toast({
                title: "Error",
                description: "Password must be at least 8 characters long.",
                variant: "destructive",
            });
            return;
        }
        changePasswordMutation.mutate({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
        });
    };
    const handleDeleteAccount = () => {
        if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            deleteAccountMutation.mutate();
        }
    };
    return (React.createElement("div", { className: "min-h-screen bg-gf-ink text-gf-snow" },
        React.createElement("section", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" },
            React.createElement("div", { className: "grid lg:grid-cols-4 gap-8" },
                React.createElement("div", { className: "lg:col-span-1" },
                    React.createElement(Sidebar_1.Sidebar, null)),
                React.createElement("div", { className: "lg:col-span-3" },
                    React.createElement(tabs_1.Tabs, { defaultValue: "notifications", className: "space-y-8" },
                        React.createElement(tabs_1.TabsList, { className: "grid w-full grid-cols-4 bg-gf-graphite" },
                            React.createElement(tabs_1.TabsTrigger, { value: "notifications", className: "data-[state=active]:bg-gf-pink" }, "Notifications"),
                            React.createElement(tabs_1.TabsTrigger, { value: "privacy", className: "data-[state=active]:bg-gf-pink" }, "Privacy"),
                            React.createElement(tabs_1.TabsTrigger, { value: "security", className: "data-[state=active]:bg-gf-pink" }, "Security"),
                            React.createElement(tabs_1.TabsTrigger, { value: "account", className: "data-[state=active]:bg-gf-pink" }, "Account")),
                        React.createElement(tabs_1.TabsContent, { value: "notifications", className: "space-y-6" },
                            React.createElement(card_1.Card, { className: "glass-overlay border-gf-smoke/20" },
                                React.createElement(card_1.CardHeader, null,
                                    React.createElement(card_1.CardTitle, { className: "flex items-center text-gf-snow" },
                                        React.createElement(lucide_react_1.Bell, { className: "h-6 w-6 mr-2 text-gf-cyan" }),
                                        "Notification Preferences")),
                                React.createElement(card_1.CardContent, { className: "space-y-6" },
                                    React.createElement("div", { className: "space-y-4" }, Object.entries(settings.notifications).map(([key, value]) => (React.createElement("div", { key: key, className: "flex items-center justify-between" },
                                        React.createElement("div", null,
                                            React.createElement(label_1.Label, { className: "text-gf-snow capitalize" }, key.replace(/([A-Z])/g, ' $1').toLowerCase()),
                                            React.createElement("p", { className: "text-sm text-gf-smoke" },
                                                key === 'newMessages' && 'Get notified when you receive new messages',
                                                key === 'newFollowers' && 'Get notified when someone follows you',
                                                key === 'tips' && 'Get notified when you receive tips',
                                                key === 'marketing' && 'Receive marketing emails and updates')),
                                        React.createElement(switch_1.Switch, { checked: value, onCheckedChange: (checked) => setSettings(Object.assign(Object.assign({}, settings), { notifications: Object.assign(Object.assign({}, settings.notifications), { [key]: checked }) })), "data-testid": `switch-${key}` })))))))),
                        React.createElement(tabs_1.TabsContent, { value: "privacy", className: "space-y-6" },
                            React.createElement(card_1.Card, { className: "glass-overlay border-gf-smoke/20" },
                                React.createElement(card_1.CardHeader, null,
                                    React.createElement(card_1.CardTitle, { className: "flex items-center text-gf-snow" },
                                        React.createElement(lucide_react_1.Eye, { className: "h-6 w-6 mr-2 text-gf-violet" }),
                                        "Privacy Settings")),
                                React.createElement(card_1.CardContent, { className: "space-y-6" },
                                    React.createElement("div", { className: "space-y-4" }, Object.entries(settings.privacy).map(([key, value]) => (React.createElement("div", { key: key, className: "flex items-center justify-between" },
                                        React.createElement("div", null,
                                            React.createElement(label_1.Label, { className: "text-gf-snow capitalize" }, key.replace(/([A-Z])/g, ' $1').toLowerCase()),
                                            React.createElement("p", { className: "text-sm text-gf-smoke" },
                                                key === 'showOnlineStatus' && 'Show when you are online to other users',
                                                key === 'allowDirectMessages' && 'Allow fans to send you direct messages',
                                                key === 'profileVisible' && 'Make your profile visible in search results')),
                                        React.createElement(switch_1.Switch, { checked: value, onCheckedChange: (checked) => setSettings(Object.assign(Object.assign({}, settings), { privacy: Object.assign(Object.assign({}, settings.privacy), { [key]: checked }) })), "data-testid": `switch-privacy-${key}` })))))))),
                        React.createElement(tabs_1.TabsContent, { value: "security", className: "space-y-6" },
                            React.createElement(card_1.Card, { className: "glass-overlay border-gf-smoke/20" },
                                React.createElement(card_1.CardHeader, null,
                                    React.createElement(card_1.CardTitle, { className: "flex items-center text-gf-snow" },
                                        React.createElement(lucide_react_1.Shield, { className: "h-6 w-6 mr-2 text-success" }),
                                        "Security Settings")),
                                React.createElement(card_1.CardContent, { className: "space-y-6" },
                                    React.createElement("div", { className: "space-y-4" }, Object.entries(settings.security).map(([key, value]) => (React.createElement("div", { key: key, className: "flex items-center justify-between" },
                                        React.createElement("div", null,
                                            React.createElement(label_1.Label, { className: "text-gf-snow capitalize" }, key.replace(/([A-Z])/g, ' $1').toLowerCase()),
                                            React.createElement("p", { className: "text-sm text-gf-smoke" },
                                                key === 'twoFactorEnabled' && 'Add an extra layer of security to your account',
                                                key === 'loginNotifications' && 'Get notified when someone logs into your account')),
                                        React.createElement(switch_1.Switch, { checked: value, onCheckedChange: (checked) => setSettings(Object.assign(Object.assign({}, settings), { security: Object.assign(Object.assign({}, settings.security), { [key]: checked }) })), "data-testid": `switch-security-${key}` }))))),
                                    React.createElement("div", { className: "border-t border-gf-smoke/20 pt-6" },
                                        React.createElement("h3", { className: "font-semibold text-gf-snow mb-4 flex items-center" },
                                            React.createElement(lucide_react_1.Lock, { className: "h-5 w-5 mr-2" }),
                                            "Change Password"),
                                        React.createElement("div", { className: "space-y-4" },
                                            React.createElement("div", null,
                                                React.createElement(label_1.Label, { htmlFor: "currentPassword", className: "text-gf-smoke" }, "Current Password"),
                                                React.createElement(input_1.Input, { id: "currentPassword", type: "password", value: passwordData.currentPassword, onChange: (e) => setPasswordData(Object.assign(Object.assign({}, passwordData), { currentPassword: e.target.value })), className: "bg-gf-graphite border-gf-smoke/20 text-gf-snow focus:border-gf-pink", "data-testid": "input-current-password" })),
                                            React.createElement("div", null,
                                                React.createElement(label_1.Label, { htmlFor: "newPassword", className: "text-gf-smoke" }, "New Password"),
                                                React.createElement(input_1.Input, { id: "newPassword", type: "password", value: passwordData.newPassword, onChange: (e) => setPasswordData(Object.assign(Object.assign({}, passwordData), { newPassword: e.target.value })), className: "bg-gf-graphite border-gf-smoke/20 text-gf-snow focus:border-gf-pink", "data-testid": "input-new-password" })),
                                            React.createElement("div", null,
                                                React.createElement(label_1.Label, { htmlFor: "confirmPassword", className: "text-gf-smoke" }, "Confirm New Password"),
                                                React.createElement(input_1.Input, { id: "confirmPassword", type: "password", value: passwordData.confirmPassword, onChange: (e) => setPasswordData(Object.assign(Object.assign({}, passwordData), { confirmPassword: e.target.value })), className: "bg-gf-graphite border-gf-smoke/20 text-gf-snow focus:border-gf-pink", "data-testid": "input-confirm-password" })),
                                            React.createElement(button_1.Button, { onClick: handleChangePassword, disabled: changePasswordMutation.isPending, className: "bg-gf-violet text-gf-snow hover:bg-gf-violet/80", "data-testid": "button-change-password" }, changePasswordMutation.isPending ? "Changing..." : "Change Password")))))),
                        React.createElement(tabs_1.TabsContent, { value: "account", className: "space-y-6" },
                            React.createElement(card_1.Card, { className: "glass-overlay border-gf-smoke/20" },
                                React.createElement(card_1.CardHeader, null,
                                    React.createElement(card_1.CardTitle, { className: "flex items-center text-gf-snow" },
                                        React.createElement(lucide_react_1.Globe, { className: "h-6 w-6 mr-2 text-gf-cyan" }),
                                        "Account Information")),
                                React.createElement(card_1.CardContent, { className: "space-y-6" },
                                    React.createElement("div", { className: "grid md:grid-cols-2 gap-6" },
                                        React.createElement("div", null,
                                            React.createElement(label_1.Label, { className: "text-gf-smoke" }, "Username"),
                                            React.createElement(input_1.Input, { value: (user === null || user === void 0 ? void 0 : user.username) || "", disabled: true, className: "bg-gf-graphite border-gf-smoke/20 text-gf-smoke" })),
                                        React.createElement("div", null,
                                            React.createElement(label_1.Label, { className: "text-gf-smoke" }, "Email"),
                                            React.createElement(input_1.Input, { value: (user === null || user === void 0 ? void 0 : user.email) || "", disabled: true, className: "bg-gf-graphite border-gf-smoke/20 text-gf-smoke" })),
                                        React.createElement("div", null,
                                            React.createElement(label_1.Label, { className: "text-gf-smoke" }, "Account Type"),
                                            React.createElement(input_1.Input, { value: (user === null || user === void 0 ? void 0 : user.role) || "", disabled: true, className: "bg-gf-graphite border-gf-smoke/20 text-gf-smoke capitalize" })),
                                        React.createElement("div", null,
                                            React.createElement(label_1.Label, { className: "text-gf-smoke" }, "Member Since"),
                                            React.createElement(input_1.Input, { value: (user === null || user === void 0 ? void 0 : user.createdAt) ? new Date(user.createdAt).toLocaleDateString() : "", disabled: true, className: "bg-gf-graphite border-gf-smoke/20 text-gf-smoke" }))))),
                            React.createElement(card_1.Card, { className: "glass-overlay border-error/20" },
                                React.createElement(card_1.CardHeader, null,
                                    React.createElement(card_1.CardTitle, { className: "flex items-center text-error" },
                                        React.createElement(lucide_react_1.AlertTriangle, { className: "h-6 w-6 mr-2" }),
                                        "Danger Zone")),
                                React.createElement(card_1.CardContent, { className: "space-y-6" },
                                    React.createElement("div", { className: "bg-error/10 border border-error/20 rounded-lg p-6" },
                                        React.createElement("h3", { className: "font-semibold text-error mb-2" }, "Delete Account"),
                                        React.createElement("p", { className: "text-gf-smoke text-sm mb-4" }, "Once you delete your account, there is no going back. Please be certain. All your content, earnings, and data will be permanently deleted."),
                                        React.createElement(button_1.Button, { onClick: handleDeleteAccount, disabled: deleteAccountMutation.isPending, variant: "destructive", className: "bg-error text-gf-snow hover:bg-error/80", "data-testid": "button-delete-account" },
                                            React.createElement(lucide_react_1.Trash2, { className: "h-4 w-4 mr-2" }),
                                            deleteAccountMutation.isPending ? "Deleting..." : "Delete Account")))))),
                    React.createElement("div", { className: "flex justify-end" },
                        React.createElement(button_1.Button, { onClick: handleSaveSettings, disabled: updateSettingsMutation.isPending, className: "bg-gf-gradient text-gf-snow hover:shadow-glow-pink", "data-testid": "button-save-settings" }, updateSettingsMutation.isPending ? "Saving..." : "Save Settings")))))));
}
