"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sidebar = Sidebar;
const wouter_1 = require("wouter");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
const useAuth_1 = require("@/hooks/useAuth");
const badge_1 = require("@/components/ui/badge");
function Sidebar() {
    const [location] = (0, wouter_1.useLocation)();
    const { user } = (0, useAuth_1.useAuth)();
    const navigation = [
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: lucide_react_1.Home,
            current: location === "/dashboard",
        },
        {
            name: "Content",
            href: "/content",
            icon: lucide_react_1.Image,
            current: location === "/content",
        },
        {
            name: "Messages",
            href: "/messages",
            icon: lucide_react_1.MessageCircle,
            current: location === "/messages",
            badge: 12,
        },
        {
            name: "Analytics",
            href: "/analytics",
            icon: lucide_react_1.BarChart3,
            current: location === "/analytics",
        },
        {
            name: "Earnings",
            href: "/earnings",
            icon: lucide_react_1.CreditCard,
            current: location === "/earnings",
        },
        {
            name: "Settings",
            href: "/settings",
            icon: lucide_react_1.Settings,
            current: location === "/settings",
        },
    ];
    // Add admin routes if user is admin
    if ((user === null || user === void 0 ? void 0 : user.role) === "admin") {
        navigation.push({
            name: "Moderation",
            href: "/moderation",
            icon: lucide_react_1.Shield,
            current: location === "/moderation",
            badge: 5,
        }, {
            name: "System Health",
            href: "/health",
            icon: lucide_react_1.Activity,
            current: location === "/health",
        });
    }
    return (React.createElement("div", { className: "glass-overlay rounded-2xl p-6 sticky top-24" },
        React.createElement("div", { className: "flex items-center space-x-3 mb-8" },
            React.createElement("img", { src: (user === null || user === void 0 ? void 0 : user.profileImageUrl) || "/api/placeholder/48/48", alt: "Creator profile", className: "w-12 h-12 rounded-full", "data-testid": "img-sidebar-profile" }),
            React.createElement("div", null,
                React.createElement("h3", { className: "font-display font-semibold text-gf-snow", "data-testid": "text-display-name" }, (user === null || user === void 0 ? void 0 : user.firstName) && (user === null || user === void 0 ? void 0 : user.lastName)
                    ? `${user.firstName} ${user.lastName}`
                    : (user === null || user === void 0 ? void 0 : user.username) || "User"),
                React.createElement("p", { className: "text-gf-smoke text-sm", "data-testid": "text-username" },
                    "@",
                    (user === null || user === void 0 ? void 0 : user.username) || "username"))),
        React.createElement("nav", { className: "space-y-2" }, navigation.map((item) => {
            const Icon = item.icon;
            return (React.createElement(wouter_1.Link, { key: item.name, href: item.href, className: (0, utils_1.cn)("flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors", item.current
                    ? "text-gf-pink bg-gf-pink/10"
                    : "text-gf-smoke hover:text-gf-pink"), "data-testid": `link-${item.name.toLowerCase().replace(" ", "-")}` },
                React.createElement(Icon, { className: "h-5 w-5" }),
                React.createElement("span", null, item.name),
                item.badge && (React.createElement(badge_1.Badge, { className: "bg-gf-violet text-xs px-2 py-1 ml-auto" }, item.badge))));
        }))));
}
