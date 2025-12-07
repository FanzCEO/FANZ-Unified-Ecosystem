"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SystemHealth;
const react_query_1 = require("@tanstack/react-query");
const card_1 = require("@/components/ui/card");
const badge_1 = require("@/components/ui/badge");
const Sidebar_1 = require("@/components/layout/Sidebar");
const useAuth_1 = require("@/hooks/useAuth");
const lucide_react_1 = require("lucide-react");
function SystemHealth() {
    var _a, _b;
    const { user } = (0, useAuth_1.useAuth)();
    // Redirect if not admin
    if ((user === null || user === void 0 ? void 0 : user.role) !== "admin") {
        return (React.createElement("div", { className: "min-h-screen bg-gf-ink text-gf-snow flex items-center justify-center" },
            React.createElement(card_1.Card, { className: "glass-overlay border-gf-smoke/20 p-8" },
                React.createElement("div", { className: "text-center" },
                    React.createElement(lucide_react_1.Shield, { className: "h-16 w-16 mx-auto mb-4 text-error" }),
                    React.createElement("h1", { className: "text-2xl font-bold text-gf-snow mb-2" }, "Access Denied"),
                    React.createElement("p", { className: "text-gf-smoke" }, "You need administrator privileges to access this page.")))));
    }
    const { data: healthData, isLoading } = (0, react_query_1.useQuery)({
        queryKey: ["/api/health"],
        refetchInterval: 30000, // Refresh every 30 seconds
    });
    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case "healthy":
            case "operational":
            case "active":
            case "connected":
                return "text-success";
            case "maintenance":
            case "warning":
                return "text-warning";
            case "error":
            case "failed":
            case "down":
                return "text-error";
            default:
                return "text-gf-smoke";
        }
    };
    const getStatusIcon = (status) => {
        switch (status.toLowerCase()) {
            case "healthy":
            case "operational":
            case "active":
            case "connected":
                return React.createElement(lucide_react_1.CheckCircle, { className: "h-5 w-5 text-success" });
            case "maintenance":
            case "warning":
                return React.createElement(lucide_react_1.AlertTriangle, { className: "h-5 w-5 text-warning" });
            case "error":
            case "failed":
            case "down":
                return React.createElement(lucide_react_1.AlertTriangle, { className: "h-5 w-5 text-error" });
            default:
                return React.createElement(lucide_react_1.Clock, { className: "h-5 w-5 text-gf-smoke" });
        }
    };
    if (isLoading) {
        return (React.createElement("div", { className: "min-h-screen bg-gf-ink text-gf-snow flex items-center justify-center" },
            React.createElement("div", { className: "text-xl" }, "Loading system health...")));
    }
    const systemServices = [
        {
            name: "API Gateway",
            icon: lucide_react_1.Globe,
            data: healthData === null || healthData === void 0 ? void 0 : healthData.apiGateway,
            borderColor: "border-success",
        },
        {
            name: "Database",
            icon: lucide_react_1.Database,
            data: healthData === null || healthData === void 0 ? void 0 : healthData.database,
            borderColor: "border-success",
        },
        {
            name: "Payments",
            icon: lucide_react_1.CreditCard,
            data: healthData === null || healthData === void 0 ? void 0 : healthData.payments,
            borderColor: "border-warning",
        },
        {
            name: "WebSocket",
            icon: lucide_react_1.Zap,
            data: healthData === null || healthData === void 0 ? void 0 : healthData.websocket,
            borderColor: "border-success",
        },
    ];
    return (React.createElement("div", { className: "min-h-screen bg-gf-ink text-gf-snow" },
        React.createElement("section", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" },
            React.createElement("div", { className: "grid lg:grid-cols-4 gap-8" },
                React.createElement("div", { className: "lg:col-span-1" },
                    React.createElement(Sidebar_1.Sidebar, null)),
                React.createElement("div", { className: "lg:col-span-3 space-y-8" },
                    React.createElement(card_1.Card, { className: "glass-overlay border-gf-smoke/20" },
                        React.createElement(card_1.CardContent, { className: "p-8" },
                            React.createElement("div", { className: "flex items-center justify-between mb-8" },
                                React.createElement("h2", { className: "font-display font-bold text-2xl text-gf-snow flex items-center" },
                                    React.createElement(lucide_react_1.Activity, { className: "h-8 w-8 mr-3 text-gf-cyan" }),
                                    "System Health & Monitoring"),
                                React.createElement("div", { className: "flex items-center space-x-2" },
                                    React.createElement("div", { className: "w-3 h-3 bg-success rounded-full animate-pulse" }),
                                    React.createElement("span", { className: "text-success text-sm font-medium", "data-testid": "overall-status" }, "All Systems Operational"))),
                            React.createElement("div", { className: "grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" }, systemServices.map((service) => {
                                const Icon = service.icon;
                                const serviceData = service.data || {};
                                return (React.createElement(card_1.Card, { key: service.name, className: `glass-overlay border-l-4 ${service.borderColor}` },
                                    React.createElement(card_1.CardContent, { className: "p-6" },
                                        React.createElement("div", { className: "flex items-center justify-between mb-4" },
                                            React.createElement("h3", { className: "font-semibold text-gf-snow" }, service.name),
                                            React.createElement(Icon, { className: getStatusColor(serviceData.status || "unknown") })),
                                        React.createElement("div", { className: "space-y-2 text-sm" },
                                            React.createElement("div", { className: "flex justify-between" },
                                                React.createElement("span", { className: "text-gf-smoke" }, "Status:"),
                                                React.createElement("div", { className: "flex items-center space-x-2" },
                                                    getStatusIcon(serviceData.status || "unknown"),
                                                    React.createElement("span", { className: getStatusColor(serviceData.status || "unknown") }, serviceData.status || "Unknown"))),
                                            serviceData.responseTime && (React.createElement("div", { className: "flex justify-between" },
                                                React.createElement("span", { className: "text-gf-smoke" }, "Response Time:"),
                                                React.createElement("span", { className: "text-gf-snow", "data-testid": `${service.name.toLowerCase()}-response-time` }, serviceData.responseTime))),
                                            serviceData.queryTime && (React.createElement("div", { className: "flex justify-between" },
                                                React.createElement("span", { className: "text-gf-smoke" }, "Query Time:"),
                                                React.createElement("span", { className: "text-gf-snow", "data-testid": `${service.name.toLowerCase()}-query-time` }, serviceData.queryTime))),
                                            serviceData.uptime && (React.createElement("div", { className: "flex justify-between" },
                                                React.createElement("span", { className: "text-gf-smoke" }, "Uptime:"),
                                                React.createElement("span", { className: "text-gf-snow", "data-testid": `${service.name.toLowerCase()}-uptime` }, serviceData.uptime))),
                                            serviceData.connections !== undefined && (React.createElement("div", { className: "flex justify-between" },
                                                React.createElement("span", { className: "text-gf-smoke" }, "Connections:"),
                                                React.createElement("span", { className: "text-gf-snow", "data-testid": `${service.name.toLowerCase()}-connections` },
                                                    serviceData.connections,
                                                    service.name === "Database" && serviceData.connections ? "/100" : ""))),
                                            serviceData.provider && (React.createElement("div", { className: "flex justify-between" },
                                                React.createElement("span", { className: "text-gf-smoke" }, "Provider:"),
                                                React.createElement("span", { className: "text-gf-snow" }, serviceData.provider))),
                                            serviceData.successRate && (React.createElement("div", { className: "flex justify-between" },
                                                React.createElement("span", { className: "text-gf-smoke" }, "Success Rate:"),
                                                React.createElement("span", { className: "text-gf-snow" }, serviceData.successRate))),
                                            serviceData.latency && (React.createElement("div", { className: "flex justify-between" },
                                                React.createElement("span", { className: "text-gf-smoke" }, "Latency:"),
                                                React.createElement("span", { className: "text-gf-snow" }, serviceData.latency)))))));
                            })))),
                    React.createElement("div", { className: "grid md:grid-cols-3 gap-6" },
                        React.createElement(card_1.Card, { className: "glass-overlay border-gf-smoke/20" },
                            React.createElement(card_1.CardHeader, null,
                                React.createElement(card_1.CardTitle, { className: "text-gf-snow flex items-center" },
                                    React.createElement(lucide_react_1.Users, { className: "h-5 w-5 mr-2 text-gf-pink" }),
                                    "Active Users")),
                            React.createElement(card_1.CardContent, null,
                                React.createElement("div", { className: "text-3xl font-bold text-gf-pink mb-2", "data-testid": "active-users-count" }, ((_a = healthData === null || healthData === void 0 ? void 0 : healthData.websocket) === null || _a === void 0 ? void 0 : _a.connections) || 0),
                                React.createElement("p", { className: "text-gf-smoke text-sm" }, "Currently online"))),
                        React.createElement(card_1.Card, { className: "glass-overlay border-gf-smoke/20" },
                            React.createElement(card_1.CardHeader, null,
                                React.createElement(card_1.CardTitle, { className: "text-gf-snow flex items-center" },
                                    React.createElement(lucide_react_1.Shield, { className: "h-5 w-5 mr-2 text-gf-violet" }),
                                    "Moderation Queue")),
                            React.createElement(card_1.CardContent, null,
                                React.createElement("div", { className: "text-3xl font-bold text-gf-violet mb-2", "data-testid": "moderation-pending-count" }, ((_b = healthData === null || healthData === void 0 ? void 0 : healthData.moderation) === null || _b === void 0 ? void 0 : _b.pending) || 0),
                                React.createElement("p", { className: "text-gf-smoke text-sm" }, "Pending review"))),
                        React.createElement(card_1.Card, { className: "glass-overlay border-gf-smoke/20" },
                            React.createElement(card_1.CardHeader, null,
                                React.createElement(card_1.CardTitle, { className: "text-gf-snow flex items-center" },
                                    React.createElement(lucide_react_1.Activity, { className: "h-5 w-5 mr-2 text-gf-cyan" }),
                                    "System Uptime")),
                            React.createElement(card_1.CardContent, null,
                                React.createElement("div", { className: "text-3xl font-bold text-gf-cyan mb-2", "data-testid": "system-uptime" },
                                    (healthData === null || healthData === void 0 ? void 0 : healthData.uptime) ? Math.floor(healthData.uptime / 3600) : 0,
                                    "h"),
                                React.createElement("p", { className: "text-gf-smoke text-sm" }, "Current session")))),
                    React.createElement(card_1.Card, { className: "glass-overlay border-gf-smoke/20" },
                        React.createElement(card_1.CardHeader, null,
                            React.createElement(card_1.CardTitle, { className: "text-gf-snow" }, "Recent System Events")),
                        React.createElement(card_1.CardContent, null,
                            React.createElement("div", { className: "space-y-3 max-h-64 overflow-y-auto" },
                                React.createElement("div", { className: "flex items-center space-x-4 py-2 border-b border-gf-smoke/10 last:border-b-0" },
                                    React.createElement("div", { className: "w-2 h-2 bg-success rounded-full" }),
                                    React.createElement("span", { className: "text-xs text-gf-smoke" }, new Date().toLocaleTimeString()),
                                    React.createElement("span", { className: "text-sm text-gf-snow" }, "System health check completed successfully"),
                                    React.createElement(badge_1.Badge, { className: "bg-gf-violet text-xs px-2 py-1 ml-auto" }, "INFO")),
                                React.createElement("div", { className: "flex items-center space-x-4 py-2 border-b border-gf-smoke/10 last:border-b-0" },
                                    React.createElement("div", { className: "w-2 h-2 bg-gf-cyan rounded-full" }),
                                    React.createElement("span", { className: "text-xs text-gf-smoke" }, new Date(Date.now() - 60000).toLocaleTimeString()),
                                    React.createElement("span", { className: "text-sm text-gf-snow" }, "WebSocket connection established"),
                                    React.createElement(badge_1.Badge, { className: "bg-gf-cyan text-xs px-2 py-1 ml-auto" }, "SYSTEM")),
                                React.createElement("div", { className: "flex items-center space-x-4 py-2 border-b border-gf-smoke/10 last:border-b-0" },
                                    React.createElement("div", { className: "w-2 h-2 bg-warning rounded-full" }),
                                    React.createElement("span", { className: "text-xs text-gf-smoke" }, new Date(Date.now() - 120000).toLocaleTimeString()),
                                    React.createElement("span", { className: "text-sm text-gf-snow" }, "Payment gateway maintenance mode activated"),
                                    React.createElement(badge_1.Badge, { className: "bg-warning text-xs px-2 py-1 ml-auto" }, "WARN"))))))))));
}
