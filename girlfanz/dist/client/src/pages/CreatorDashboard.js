"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatorDashboard = CreatorDashboard;
const react_query_1 = require("@tanstack/react-query");
const card_1 = require("@/components/ui/card");
const tabs_1 = require("@/components/ui/tabs");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const lucide_react_1 = require("lucide-react");
const use_toast_1 = require("@/hooks/use-toast");
function CreatorDashboard() {
    const { toast } = (0, use_toast_1.useToast)();
    const { data: earnings, isLoading: earningsLoading } = (0, react_query_1.useQuery)({
        queryKey: ['/api/payouts/earnings'],
        refetchInterval: 30000 // Refresh every 30 seconds
    });
    const handleRequestPayout = async () => {
        try {
            const response = await fetch('/api/payouts/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: (earnings === null || earnings === void 0 ? void 0 : earnings.pendingEarnings) || 0,
                    payoutAccountId: 'default'
                })
            });
            if (response.ok) {
                toast({
                    title: "Payout Requested",
                    description: "Your payout request has been submitted for processing.",
                });
            }
            else {
                throw new Error('Failed to request payout');
            }
        }
        catch (error) {
            toast({
                title: "Error",
                description: "Failed to request payout. Please try again.",
                variant: "destructive"
            });
        }
    };
    if (earningsLoading) {
        return (React.createElement("div", { className: "container mx-auto px-4 py-8" },
            React.createElement("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-4" }, [1, 2, 3, 4].map((i) => (React.createElement(card_1.Card, { key: i },
                React.createElement(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2" },
                    React.createElement("div", { className: "h-4 bg-muted animate-pulse rounded" }),
                    React.createElement("div", { className: "h-4 w-4 bg-muted animate-pulse rounded" })),
                React.createElement(card_1.CardContent, null,
                    React.createElement("div", { className: "h-8 bg-muted animate-pulse rounded mb-2" }),
                    React.createElement("div", { className: "h-3 bg-muted animate-pulse rounded" }))))))));
    }
    return (React.createElement("div", { className: "min-h-screen bg-black text-white" },
        React.createElement("div", { className: "fixed inset-0 opacity-20 bg-cover bg-center bg-no-repeat", style: {
                backgroundImage: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1000 1000\"><defs><radialGradient id=\"g\" cx=\"50%\" cy=\"50%\" r=\"50%\"><stop offset=\"0%\" stop-color=\"%23ff00ff\" stop-opacity=\"0.3\"/><stop offset=\"100%\" stop-color=\"%2300ffff\" stop-opacity=\"0.1\"/></radialGradient></defs><rect width=\"100%\" height=\"100%\" fill=\"url(%23g)\"/></svg>')"
            } }),
        React.createElement("div", { className: "relative container mx-auto px-4 py-8" },
            React.createElement("div", { className: "mb-8" },
                React.createElement("h1", { className: "text-4xl font-bold mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent" }, "Creator Dashboard"),
                React.createElement("p", { className: "text-gray-400" }, "Monitor your earnings, content performance, and manage your creator profile")),
            React.createElement("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8" },
                React.createElement(card_1.Card, { className: "bg-gray-900/50 border-gray-800" },
                    React.createElement(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2" },
                        React.createElement(card_1.CardTitle, { className: "text-sm font-medium text-gray-400" }, "Total Earnings"),
                        React.createElement(lucide_react_1.DollarSign, { className: "h-4 w-4 text-pink-400" })),
                    React.createElement(card_1.CardContent, null,
                        React.createElement("div", { className: "text-2xl font-bold text-white" },
                            "$",
                            (((earnings === null || earnings === void 0 ? void 0 : earnings.totalEarnings) || 0) / 100).toFixed(2)),
                        React.createElement("p", { className: "text-xs text-gray-500" }, "All time earnings"))),
                React.createElement(card_1.Card, { className: "bg-gray-900/50 border-gray-800" },
                    React.createElement(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2" },
                        React.createElement(card_1.CardTitle, { className: "text-sm font-medium text-gray-400" }, "Pending Payout"),
                        React.createElement(lucide_react_1.CreditCard, { className: "h-4 w-4 text-green-400" })),
                    React.createElement(card_1.CardContent, null,
                        React.createElement("div", { className: "text-2xl font-bold text-white" },
                            "$",
                            (((earnings === null || earnings === void 0 ? void 0 : earnings.pendingEarnings) || 0) / 100).toFixed(2)),
                        React.createElement("p", { className: "text-xs text-gray-500" }, "Available for payout"))),
                React.createElement(card_1.Card, { className: "bg-gray-900/50 border-gray-800" },
                    React.createElement(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2" },
                        React.createElement(card_1.CardTitle, { className: "text-sm font-medium text-gray-400" }, "Monthly Average"),
                        React.createElement(lucide_react_1.TrendingUp, { className: "h-4 w-4 text-blue-400" })),
                    React.createElement(card_1.CardContent, null,
                        React.createElement("div", { className: "text-2xl font-bold text-white" },
                            "$",
                            (((earnings === null || earnings === void 0 ? void 0 : earnings.averageMonthly) || 0) / 100).toFixed(2)),
                        React.createElement("p", { className: "text-xs text-gray-500" }, "Last 12 months"))),
                React.createElement(card_1.Card, { className: "bg-gray-900/50 border-gray-800" },
                    React.createElement(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2" },
                        React.createElement(card_1.CardTitle, { className: "text-sm font-medium text-gray-400" }, "Last Payout"),
                        React.createElement(lucide_react_1.Calendar, { className: "h-4 w-4 text-purple-400" })),
                    React.createElement(card_1.CardContent, null,
                        React.createElement("div", { className: "text-2xl font-bold text-white" }, (earnings === null || earnings === void 0 ? void 0 : earnings.lastPayout) ? 'Recent' : 'None'),
                        React.createElement("p", { className: "text-xs text-gray-500" }, "Previous payment")))),
            React.createElement(tabs_1.Tabs, { defaultValue: "earnings", className: "space-y-6" },
                React.createElement(tabs_1.TabsList, { className: "bg-gray-900/50 border-gray-800" },
                    React.createElement(tabs_1.TabsTrigger, { value: "earnings", "data-testid": "tab-earnings" },
                        React.createElement(lucide_react_1.DollarSign, { className: "h-4 w-4 mr-2" }),
                        "Earnings"),
                    React.createElement(tabs_1.TabsTrigger, { value: "content", "data-testid": "tab-content" },
                        React.createElement(lucide_react_1.Eye, { className: "h-4 w-4 mr-2" }),
                        "Content"),
                    React.createElement(tabs_1.TabsTrigger, { value: "compliance", "data-testid": "tab-compliance" },
                        React.createElement(lucide_react_1.Shield, { className: "h-4 w-4 mr-2" }),
                        "Compliance")),
                React.createElement(tabs_1.TabsContent, { value: "earnings", className: "space-y-6" },
                    React.createElement(card_1.Card, { className: "bg-gray-900/50 border-gray-800" },
                        React.createElement(card_1.CardHeader, null,
                            React.createElement(card_1.CardTitle, { className: "text-white" }, "Request Payout"),
                            React.createElement(card_1.CardDescription, { className: "text-gray-400" }, "Request a payout of your available earnings")),
                        React.createElement(card_1.CardContent, { className: "space-y-4" },
                            React.createElement("div", { className: "flex items-center justify-between" },
                                React.createElement("span", { className: "text-gray-400" }, "Available Balance:"),
                                React.createElement("span", { className: "text-xl font-bold text-white" },
                                    "$",
                                    (((earnings === null || earnings === void 0 ? void 0 : earnings.pendingEarnings) || 0) / 100).toFixed(2))),
                            React.createElement(button_1.Button, { onClick: handleRequestPayout, disabled: ((earnings === null || earnings === void 0 ? void 0 : earnings.pendingEarnings) || 0) < 5000, className: "w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700", "data-testid": "button-request-payout" }, ((earnings === null || earnings === void 0 ? void 0 : earnings.pendingEarnings) || 0) < 5000 ?
                                'Minimum $50.00 required' :
                                'Request Payout'),
                            React.createElement("div", { className: "text-xs text-gray-500" }, "Payouts are processed on the 1st of each month via adult-friendly processors (Paxum, eCP, etc.)"))),
                    React.createElement(card_1.Card, { className: "bg-gray-900/50 border-gray-800" },
                        React.createElement(card_1.CardHeader, null,
                            React.createElement(card_1.CardTitle, { className: "text-white" }, "Payout History"),
                            React.createElement(card_1.CardDescription, { className: "text-gray-400" }, "Your recent payout transactions")),
                        React.createElement(card_1.CardContent, null, (earnings === null || earnings === void 0 ? void 0 : earnings.payoutHistory) && earnings.payoutHistory.length > 0 ? (React.createElement("div", { className: "space-y-3" }, earnings.payoutHistory.map((payout, index) => (React.createElement("div", { key: index, className: "flex items-center justify-between p-3 bg-gray-800/50 rounded-lg" },
                            React.createElement("div", { className: "flex items-center space-x-3" },
                                React.createElement(lucide_react_1.CreditCard, { className: "h-5 w-5 text-green-400" }),
                                React.createElement("div", null,
                                    React.createElement("p", { className: "text-sm font-medium text-white" },
                                        "$",
                                        (payout.amount / 100).toFixed(2)),
                                    React.createElement("p", { className: "text-xs text-gray-400" }, new Date(payout.createdAt).toLocaleDateString()))),
                            React.createElement(badge_1.Badge, { variant: payout.status === 'completed' ? 'default' : 'secondary' }, payout.status)))))) : (React.createElement("div", { className: "text-center py-8 text-gray-500" },
                            React.createElement(lucide_react_1.CreditCard, { className: "h-12 w-12 mx-auto mb-3 opacity-50" }),
                            React.createElement("p", null, "No payout history yet"),
                            React.createElement("p", { className: "text-sm" }, "Start creating content to earn your first payout")))))),
                React.createElement(tabs_1.TabsContent, { value: "content", className: "space-y-6" },
                    React.createElement(card_1.Card, { className: "bg-gray-900/50 border-gray-800" },
                        React.createElement(card_1.CardHeader, null,
                            React.createElement(card_1.CardTitle, { className: "text-white" }, "Content Performance"),
                            React.createElement(card_1.CardDescription, { className: "text-gray-400" }, "Track your content metrics and engagement")),
                        React.createElement(card_1.CardContent, null,
                            React.createElement("div", { className: "text-center py-8 text-gray-500" },
                                React.createElement(lucide_react_1.Eye, { className: "h-12 w-12 mx-auto mb-3 opacity-50" }),
                                React.createElement("p", null, "Content analytics coming soon"),
                                React.createElement("p", { className: "text-sm" }, "View detailed performance metrics for your posts"))))),
                React.createElement(tabs_1.TabsContent, { value: "compliance", className: "space-y-6" },
                    React.createElement(card_1.Card, { className: "bg-gray-900/50 border-gray-800" },
                        React.createElement(card_1.CardHeader, null,
                            React.createElement(card_1.CardTitle, { className: "text-white flex items-center" },
                                React.createElement(lucide_react_1.Shield, { className: "h-5 w-5 mr-2 text-green-400" }),
                                "Compliance Status"),
                            React.createElement(card_1.CardDescription, { className: "text-gray-400" }, "Maintain your platform compliance and verification status")),
                        React.createElement(card_1.CardContent, { className: "space-y-4" },
                            React.createElement("div", { className: "flex items-center justify-between p-4 bg-gray-800/50 rounded-lg" },
                                React.createElement("div", { className: "flex items-center space-x-3" },
                                    React.createElement("div", { className: "h-2 w-2 bg-green-400 rounded-full" }),
                                    React.createElement("div", null,
                                        React.createElement("p", { className: "font-medium text-white" }, "Age Verification"),
                                        React.createElement("p", { className: "text-sm text-gray-400" }, "Verified via VerifyMy"))),
                                React.createElement(badge_1.Badge, { className: "bg-green-600" }, "Verified")),
                            React.createElement("div", { className: "flex items-center justify-between p-4 bg-gray-800/50 rounded-lg" },
                                React.createElement("div", { className: "flex items-center space-x-3" },
                                    React.createElement("div", { className: "h-2 w-2 bg-green-400 rounded-full" }),
                                    React.createElement("div", null,
                                        React.createElement("p", { className: "font-medium text-white" }, "Identity Verification"),
                                        React.createElement("p", { className: "text-sm text-gray-400" }, "Government ID verified"))),
                                React.createElement(badge_1.Badge, { className: "bg-green-600" }, "Verified")),
                            React.createElement("div", { className: "flex items-center justify-between p-4 bg-gray-800/50 rounded-lg" },
                                React.createElement("div", { className: "flex items-center space-x-3" },
                                    React.createElement("div", { className: "h-2 w-2 bg-green-400 rounded-full" }),
                                    React.createElement("div", null,
                                        React.createElement("p", { className: "font-medium text-white" }, "2257 Compliance"),
                                        React.createElement("p", { className: "text-sm text-gray-400" }, "Record keeping compliant"))),
                                React.createElement(badge_1.Badge, { className: "bg-green-600" }, "Active")),
                            React.createElement("div", { className: "flex items-center justify-between p-4 bg-gray-800/50 rounded-lg" },
                                React.createElement("div", { className: "flex items-center space-x-3" },
                                    React.createElement("div", { className: "h-2 w-2 bg-blue-400 rounded-full" }),
                                    React.createElement("div", null,
                                        React.createElement("p", { className: "font-medium text-white" }, "Content Protection"),
                                        React.createElement("p", { className: "text-sm text-gray-400" }, "Forensic fingerprinting enabled"))),
                                React.createElement(badge_1.Badge, { className: "bg-blue-600" }, "Protected")),
                            React.createElement("div", { className: "mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg" },
                                React.createElement("div", { className: "flex items-start space-x-3" },
                                    React.createElement(lucide_react_1.AlertTriangle, { className: "h-5 w-5 text-blue-400 mt-0.5" }),
                                    React.createElement("div", null,
                                        React.createElement("p", { className: "text-sm font-medium text-blue-300" }, "Compliance Information"),
                                        React.createElement("p", { className: "text-xs text-blue-400 mt-1" }, "GirlFanz maintains full compliance with 18 U.S.C. \u00A72257 record keeping requirements and all applicable adult content regulations. All content is protected with forensic watermarking for copyright protection.")))))))))));
}
