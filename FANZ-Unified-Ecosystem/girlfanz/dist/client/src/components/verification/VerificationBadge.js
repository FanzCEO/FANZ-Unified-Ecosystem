"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = VerificationBadge;
const react_query_1 = require("@tanstack/react-query");
const badge_1 = require("@/components/ui/badge");
const lucide_react_1 = require("lucide-react");
const tooltip_1 = require("@/components/ui/tooltip");
function VerificationBadge({ userId, size = 'md', showText = false, className = '' }) {
    // If userId is provided, fetch that user's verification status
    // Otherwise fetch current user's status
    const endpoint = userId
        ? `/api/verification/status/${userId}`
        : '/api/verification/status';
    const { data: status } = (0, react_query_1.useQuery)({
        queryKey: [endpoint],
    });
    if (!(status === null || status === void 0 ? void 0 : status.verified)) {
        return null;
    }
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6'
    };
    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    };
    const BadgeContent = () => {
        if (showText) {
            return (React.createElement(badge_1.Badge, { variant: "default", className: `bg-blue-500 hover:bg-blue-600 ${className}`, "data-testid": "badge-verified-with-text" },
                React.createElement(lucide_react_1.CheckCircle, { className: `${sizeClasses[size]} mr-1` }),
                React.createElement("span", { className: textSizeClasses[size] }, "Verified")));
        }
        return (React.createElement("div", { className: `inline-flex items-center justify-center rounded-full bg-blue-500 text-white p-0.5 ${className}`, "data-testid": "badge-verified-icon" },
            React.createElement(lucide_react_1.CheckCircle, { className: sizeClasses[size] })));
    };
    const validUntilDate = status.validUntil
        ? new Date(status.validUntil).toLocaleDateString()
        : null;
    const tooltipContent = (React.createElement("div", { className: "space-y-1" },
        React.createElement("div", { className: "font-medium flex items-center gap-1" },
            React.createElement(lucide_react_1.Shield, { className: "h-3 w-3" }),
            "Identity Verified"),
        status.verifiedAt && (React.createElement("p", { className: "text-xs" },
            "Verified on ",
            new Date(status.verifiedAt).toLocaleDateString())),
        validUntilDate && (React.createElement("p", { className: "text-xs" },
            "Valid until ",
            validUntilDate)),
        status.provider && (React.createElement("p", { className: "text-xs text-muted-foreground" },
            "Verified by ",
            status.provider))));
    return (React.createElement(tooltip_1.TooltipProvider, null,
        React.createElement(tooltip_1.Tooltip, null,
            React.createElement(tooltip_1.TooltipTrigger, { asChild: true },
                React.createElement("span", { className: "inline-block" },
                    React.createElement(BadgeContent, null))),
            React.createElement(tooltip_1.TooltipContent, null, tooltipContent))));
}
