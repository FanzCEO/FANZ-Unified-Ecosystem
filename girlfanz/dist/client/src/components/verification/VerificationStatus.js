"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = VerificationStatus;
const react_query_1 = require("@tanstack/react-query");
const card_1 = require("@/components/ui/card");
const progress_1 = require("@/components/ui/progress");
const badge_1 = require("@/components/ui/badge");
const button_1 = require("@/components/ui/button");
const alert_1 = require("@/components/ui/alert");
const lucide_react_1 = require("lucide-react");
function VerificationStatus({ onVerify, compact = false }) {
    const { data: status, isLoading } = (0, react_query_1.useQuery)({
        queryKey: ['/api/verification/status'],
        refetchInterval: (data) => {
            // Poll if verification is in progress
            if ((data === null || data === void 0 ? void 0 : data.status) === 'processing' || (data === null || data === void 0 ? void 0 : data.status) === 'pending') {
                return 5000; // Poll every 5 seconds
            }
            return false;
        }
    });
    const { data: history } = (0, react_query_1.useQuery)({
        queryKey: ['/api/verification/history'],
        enabled: !compact
    });
    if (isLoading) {
        return (React.createElement(card_1.Card, null,
            React.createElement(card_1.CardContent, { className: "py-8" },
                React.createElement("div", { className: "flex items-center justify-center" },
                    React.createElement(lucide_react_1.RefreshCw, { className: "h-6 w-6 animate-spin text-muted-foreground" })))));
    }
    const getStatusColor = (verificationStatus) => {
        switch (verificationStatus) {
            case 'verified':
                return 'text-green-500';
            case 'processing':
                return 'text-yellow-500';
            case 'rejected':
            case 'failed':
                return 'text-red-500';
            default:
                return 'text-muted-foreground';
        }
    };
    const getStatusIcon = (verificationStatus) => {
        switch (verificationStatus) {
            case 'verified':
                return React.createElement(lucide_react_1.CheckCircle, { className: "h-5 w-5" });
            case 'processing':
                return React.createElement(lucide_react_1.Clock, { className: "h-5 w-5 animate-spin" });
            case 'rejected':
            case 'failed':
                return React.createElement(lucide_react_1.AlertCircle, { className: "h-5 w-5" });
            default:
                return React.createElement(lucide_react_1.Shield, { className: "h-5 w-5" });
        }
    };
    const getStatusBadge = (verificationStatus) => {
        switch (verificationStatus) {
            case 'verified':
                return React.createElement(badge_1.Badge, { className: "bg-green-100 text-green-800" }, "Verified");
            case 'processing':
                return React.createElement(badge_1.Badge, { className: "bg-yellow-100 text-yellow-800" }, "Processing");
            case 'rejected':
                return React.createElement(badge_1.Badge, { variant: "destructive" }, "Rejected");
            case 'failed':
                return React.createElement(badge_1.Badge, { variant: "destructive" }, "Failed");
            case 'expired':
                return React.createElement(badge_1.Badge, { variant: "secondary" }, "Expired");
            default:
                return React.createElement(badge_1.Badge, { variant: "outline" }, "Not Verified");
        }
    };
    const daysUntilExpiry = (status === null || status === void 0 ? void 0 : status.validUntil)
        ? Math.floor((new Date(status.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0;
    const needsReverification = (status === null || status === void 0 ? void 0 : status.status) === 'expired' ||
        ((status === null || status === void 0 ? void 0 : status.status) === 'verified' && daysUntilExpiry < 30);
    if (compact) {
        return (React.createElement("div", { className: "flex items-center gap-2", "data-testid": "verification-status-compact" },
            React.createElement("div", { className: getStatusColor(status === null || status === void 0 ? void 0 : status.status) }, getStatusIcon(status === null || status === void 0 ? void 0 : status.status)),
            getStatusBadge(status === null || status === void 0 ? void 0 : status.status),
            (status === null || status === void 0 ? void 0 : status.status) === 'verified' && (status === null || status === void 0 ? void 0 : status.validUntil) && (React.createElement("span", { className: "text-xs text-muted-foreground" },
                "Valid until ",
                new Date(status.validUntil).toLocaleDateString()))));
    }
    return (React.createElement("div", { className: "space-y-4" },
        React.createElement(card_1.Card, { "data-testid": "card-verification-status" },
            React.createElement(card_1.CardHeader, null,
                React.createElement(card_1.CardTitle, { className: "flex items-center gap-2" },
                    React.createElement(lucide_react_1.Shield, { className: "h-5 w-5" }),
                    "Identity Verification"),
                React.createElement(card_1.CardDescription, null, "Your verification status and compliance information")),
            React.createElement(card_1.CardContent, { className: "space-y-6" },
                React.createElement("div", { className: "space-y-4" },
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement("span", { className: "text-sm font-medium" }, "Current Status"),
                        getStatusBadge(status === null || status === void 0 ? void 0 : status.status)),
                    (status === null || status === void 0 ? void 0 : status.status) === 'processing' && (React.createElement(React.Fragment, null,
                        React.createElement(progress_1.Progress, { value: 75, className: "w-full" }),
                        React.createElement("p", { className: "text-sm text-muted-foreground" }, "Your verification is being processed. This usually takes 1-2 minutes."))),
                    (status === null || status === void 0 ? void 0 : status.status) === 'verified' && (React.createElement("div", { className: "space-y-3" },
                        React.createElement("div", { className: "flex items-center gap-2 text-green-600" },
                            React.createElement(lucide_react_1.CheckCircle, { className: "h-4 w-4" }),
                            React.createElement("span", { className: "text-sm font-medium" }, "Identity verified successfully")),
                        status.validUntil && (React.createElement("div", { className: "grid grid-cols-2 gap-4" },
                            React.createElement("div", { className: "space-y-1" },
                                React.createElement("p", { className: "text-xs text-muted-foreground" }, "Verified On"),
                                React.createElement("p", { className: "text-sm font-medium" }, new Date(status.verifiedAt).toLocaleDateString())),
                            React.createElement("div", { className: "space-y-1" },
                                React.createElement("p", { className: "text-xs text-muted-foreground" }, "Valid Until"),
                                React.createElement("p", { className: "text-sm font-medium" }, new Date(status.validUntil).toLocaleDateString())))),
                        needsReverification && (React.createElement(alert_1.Alert, { className: "border-yellow-500" },
                            React.createElement(lucide_react_1.AlertCircle, { className: "h-4 w-4" }),
                            React.createElement(alert_1.AlertDescription, null,
                                "Your verification ",
                                daysUntilExpiry > 0 ? `expires in ${daysUntilExpiry} days` : 'has expired',
                                ". Please reverify to maintain access."))))),
                    (status === null || status === void 0 ? void 0 : status.status) === 'rejected' && (React.createElement(alert_1.Alert, { variant: "destructive" },
                        React.createElement(lucide_react_1.AlertCircle, { className: "h-4 w-4" }),
                        React.createElement(alert_1.AlertDescription, null,
                            "Your verification was rejected. ",
                            status.rejectionReason || 'Please try again with clearer documents.'))),
                    (!status || status.status === 'none') && (React.createElement(alert_1.Alert, null,
                        React.createElement(lucide_react_1.Shield, { className: "h-4 w-4" }),
                        React.createElement(alert_1.AlertDescription, null, "Complete identity verification to unlock all creator features and ensure compliance.")))),
                (status === null || status === void 0 ? void 0 : status.status) === 'verified' && status.details && (React.createElement("div", { className: "space-y-3 border-t pt-4" },
                    React.createElement("h4", { className: "text-sm font-medium" }, "Verification Details"),
                    React.createElement("div", { className: "grid grid-cols-2 gap-3" },
                        React.createElement("div", { className: "flex items-center gap-2" },
                            React.createElement(lucide_react_1.FileText, { className: "h-4 w-4 text-muted-foreground" }),
                            React.createElement("div", null,
                                React.createElement("p", { className: "text-xs text-muted-foreground" }, "Document Type"),
                                React.createElement("p", { className: "text-sm" }, status.details.documentType || 'ID Document'))),
                        React.createElement("div", { className: "flex items-center gap-2" },
                            React.createElement(lucide_react_1.Camera, { className: "h-4 w-4 text-muted-foreground" }),
                            React.createElement("div", null,
                                React.createElement("p", { className: "text-xs text-muted-foreground" }, "Liveness Check"),
                                React.createElement("p", { className: "text-sm" }, "Passed")))),
                    status.details.confidence && (React.createElement("div", null,
                        React.createElement("p", { className: "text-xs text-muted-foreground mb-1" }, "Confidence Score"),
                        React.createElement(progress_1.Progress, { value: status.details.confidence, className: "h-2" }),
                        React.createElement("p", { className: "text-xs text-muted-foreground mt-1" },
                            status.details.confidence,
                            "%"))))),
                React.createElement("div", { className: "flex gap-3" },
                    ((status === null || status === void 0 ? void 0 : status.status) === 'none' || (status === null || status === void 0 ? void 0 : status.status) === 'rejected' || needsReverification) && (React.createElement(button_1.Button, { onClick: onVerify, className: "flex-1", "data-testid": "button-start-verification" },
                        React.createElement(lucide_react_1.Shield, { className: "h-4 w-4 mr-2" }),
                        needsReverification ? 'Reverify Identity' : 'Start Verification')),
                    (status === null || status === void 0 ? void 0 : status.status) === 'verified' && !needsReverification && (React.createElement(button_1.Button, { variant: "outline", className: "flex-1", disabled: true, "data-testid": "button-verified" },
                        React.createElement(lucide_react_1.CheckCircle, { className: "h-4 w-4 mr-2 text-green-500" }),
                        "Verified"))))),
        history && history.length > 0 && (React.createElement(card_1.Card, null,
            React.createElement(card_1.CardHeader, null,
                React.createElement(card_1.CardTitle, null, "Verification History")),
            React.createElement(card_1.CardContent, null,
                React.createElement("div", { className: "space-y-3" }, history.map((item) => (React.createElement("div", { key: item.id, className: "flex items-center justify-between py-2 border-b last:border-0" },
                    React.createElement("div", { className: "flex items-center gap-3" },
                        React.createElement("div", { className: getStatusColor(item.status) }, getStatusIcon(item.status)),
                        React.createElement("div", null,
                            React.createElement("p", { className: "text-sm font-medium" }, item.type === 'identity' ? 'Identity Verification' : 'Age Verification'),
                            React.createElement("p", { className: "text-xs text-muted-foreground" }, new Date(item.createdAt).toLocaleDateString()))),
                    getStatusBadge(item.status))))))))));
}
