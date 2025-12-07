"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedHeader = EnhancedHeader;
const react_1 = require("react");
const wouter_1 = require("wouter");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const badge_1 = require("@/components/ui/badge");
const dropdown_menu_1 = require("@/components/ui/dropdown-menu");
const dialog_1 = require("@/components/ui/dialog");
const scroll_area_1 = require("@/components/ui/scroll-area");
const useAuth_1 = require("@/hooks/useAuth");
const navigation_1 = require("@/config/navigation");
function EnhancedHeader() {
    const [location, navigate] = (0, wouter_1.useLocation)();
    const { user, isAuthenticated } = (0, useAuth_1.useAuth)();
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = (0, react_1.useState)(false);
    const [commandSearch, setCommandSearch] = (0, react_1.useState)('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = (0, react_1.useState)(false);
    // Generate breadcrumbs for current location
    const breadcrumbs = (0, navigation_1.generateBreadcrumbs)(location);
    // Get user role
    const userRole = (user === null || user === void 0 ? void 0 : user.role) || 'fan';
    // Filter commands by role
    const availableCommands = (0, navigation_1.getCommandsForRole)(userRole);
    // Filter commands by search
    const filteredCommands = availableCommands.filter(cmd => cmd.label.toLowerCase().includes(commandSearch.toLowerCase()) ||
        cmd.keywords.some(keyword => keyword.toLowerCase().includes(commandSearch.toLowerCase())));
    // Group commands
    const groupedCommands = filteredCommands.reduce((groups, command) => {
        const group = command.group;
        if (!groups[group])
            groups[group] = [];
        groups[group].push(command);
        return groups;
    }, {});
    // Handle command selection
    const handleCommandSelect = (command) => {
        if (command.href) {
            navigate(command.href);
        }
        else if (command.action) {
            command.action();
        }
        setIsCommandPaletteOpen(false);
        setCommandSearch('');
    };
    // Keyboard shortcuts
    (0, react_1.useEffect)(() => {
        const handleKeyDown = (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                setIsCommandPaletteOpen(true);
            }
            if (event.key === 'Escape') {
                setIsCommandPaletteOpen(false);
                setCommandSearch('');
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);
    // Get all navigation items for current user
    const getAllNavigationForUser = () => {
        const items = [...navigation_1.mainNavigation];
        if (userRole === 'creator' || userRole === 'admin') {
            items.push(...navigation_1.creatorNavigation);
        }
        items.push(...navigation_1.supportNavigation, ...navigation_1.accountNavigation);
        if (userRole === 'admin') {
            items.push(...navigation_1.adminNavigation);
        }
        return items;
    };
    const navigationItems = getAllNavigationForUser();
    if (!isAuthenticated) {
        return (React.createElement("header", { className: "bg-gf-ink/95 backdrop-blur-sm border-b border-gf-smoke/20 sticky top-0 z-50" },
            React.createElement("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" },
                React.createElement("div", { className: "flex justify-between items-center py-4" },
                    React.createElement(wouter_1.Link, { href: "/", className: "flex items-center space-x-2" },
                        React.createElement("div", { className: "text-2xl font-bold" },
                            React.createElement("span", { className: "bg-gradient-to-r from-gf-pink to-gf-cyan bg-clip-text text-transparent" }, "GirlFanz"),
                            React.createElement("span", { className: "text-xs text-gf-cyan ml-1" }, "\u2122"))),
                    React.createElement("div", { className: "flex items-center space-x-4" },
                        React.createElement(wouter_1.Link, { href: "/help" },
                            React.createElement(button_1.Button, { variant: "ghost", className: "text-gf-snow hover:bg-gf-smoke/20", "data-testid": "link-help-center" }, "Help Center")),
                        React.createElement(button_1.Button, { onClick: () => window.location.href = '/api/login', className: "bg-gradient-to-r from-gf-pink to-gf-purple hover:from-gf-pink/90 hover:to-gf-purple/90", "data-testid": "button-login" }, "Sign In"))))));
    }
    return (React.createElement(React.Fragment, null,
        React.createElement("header", { className: "bg-gf-ink/95 backdrop-blur-sm border-b border-gf-smoke/20 sticky top-0 z-50" },
            React.createElement("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" },
                React.createElement("div", { className: "flex justify-between items-center py-4" },
                    React.createElement("div", { className: "flex items-center space-x-4" },
                        React.createElement(button_1.Button, { variant: "ghost", size: "sm", className: "lg:hidden text-gf-snow hover:bg-gf-smoke/20", onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen), "data-testid": "button-mobile-menu" }, isMobileMenuOpen ? React.createElement(lucide_react_1.X, { size: 20 }) : React.createElement(lucide_react_1.Menu, { size: 20 })),
                        React.createElement(wouter_1.Link, { href: "/dashboard", className: "flex items-center space-x-2" },
                            React.createElement("div", { className: "text-2xl font-bold" },
                                React.createElement("span", { className: "bg-gradient-to-r from-gf-pink to-gf-cyan bg-clip-text text-transparent" }, "GirlFanz"),
                                React.createElement("span", { className: "text-xs text-gf-cyan ml-1" }, "\u2122")))),
                    React.createElement("nav", { className: "hidden lg:flex items-center space-x-6" }, navigation_1.mainNavigation.map((item) => (React.createElement(wouter_1.Link, { key: item.id, href: item.href },
                        React.createElement(button_1.Button, { variant: location === item.href ? "default" : "ghost", className: `text-sm ${location === item.href
                                ? "bg-gradient-to-r from-gf-pink to-gf-purple"
                                : "text-gf-snow hover:bg-gf-smoke/20"}`, "data-testid": `nav-${item.id}` },
                            React.createElement(item.icon, { className: "w-4 h-4 mr-2" }),
                            item.label,
                            item.badge && (React.createElement(badge_1.Badge, { className: "ml-2 bg-gf-cyan text-gf-ink text-xs" }, item.badge))))))),
                    React.createElement("div", { className: "flex items-center space-x-4" },
                        React.createElement("div", { className: "hidden md:flex items-center" },
                            React.createElement(button_1.Button, { variant: "ghost", onClick: () => setIsCommandPaletteOpen(true), className: "text-gf-snow hover:bg-gf-smoke/20 text-sm", "data-testid": "button-command-palette" },
                                React.createElement(lucide_react_1.Search, { className: "w-4 h-4 mr-2" }),
                                "Search",
                                React.createElement("kbd", { className: "ml-2 text-xs bg-gf-smoke/20 px-2 py-1 rounded" }, "\u2318K"))),
                        React.createElement(button_1.Button, { variant: "ghost", size: "sm", className: "text-gf-snow hover:bg-gf-smoke/20 relative", "data-testid": "button-notifications" },
                            React.createElement(lucide_react_1.Bell, { className: "w-5 h-5" }),
                            React.createElement(badge_1.Badge, { className: "absolute -top-2 -right-2 bg-gf-pink text-gf-ink text-xs" }, "3")),
                        React.createElement(dropdown_menu_1.DropdownMenu, null,
                            React.createElement(dropdown_menu_1.DropdownMenuTrigger, { asChild: true },
                                React.createElement(button_1.Button, { variant: "ghost", size: "sm", className: "text-gf-snow hover:bg-gf-smoke/20", "data-testid": "button-user-menu" },
                                    React.createElement(lucide_react_1.User, { className: "w-5 h-5" }))),
                            React.createElement(dropdown_menu_1.DropdownMenuContent, { align: "end", className: "bg-gf-ink border-gf-smoke/20" },
                                React.createElement("div", { className: "px-3 py-2" },
                                    React.createElement("p", { className: "text-sm font-medium text-gf-snow" }, (user === null || user === void 0 ? void 0 : user.firstName) || (user === null || user === void 0 ? void 0 : user.username) || 'User'),
                                    React.createElement("p", { className: "text-xs text-gf-smoke" }, user === null || user === void 0 ? void 0 : user.email),
                                    React.createElement(badge_1.Badge, { className: "mt-1 bg-gf-purple text-xs" }, userRole.charAt(0).toUpperCase() + userRole.slice(1))),
                                React.createElement(dropdown_menu_1.DropdownMenuSeparator, { className: "bg-gf-smoke/20" }),
                                navigation_1.accountNavigation.map((item) => (React.createElement(dropdown_menu_1.DropdownMenuItem, { key: item.id, asChild: true },
                                    React.createElement(wouter_1.Link, { href: item.href, className: "flex items-center text-gf-snow hover:bg-gf-smoke/20" },
                                        React.createElement(item.icon, { className: "w-4 h-4 mr-2" }),
                                        item.label)))),
                                React.createElement(dropdown_menu_1.DropdownMenuSeparator, { className: "bg-gf-smoke/20" }),
                                React.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: () => {
                                        // For now, redirect to logout - this would integrate with auth service
                                        window.location.href = '/api/auth/logout';
                                    }, className: "text-gf-snow hover:bg-gf-smoke/20" },
                                    React.createElement(lucide_react_1.LogOut, { className: "w-4 h-4 mr-2" }),
                                    "Sign Out"))))),
                breadcrumbs.length > 1 && (React.createElement("div", { className: "flex items-center space-x-2 pb-4" }, breadcrumbs.map((crumb, index) => (React.createElement("div", { key: crumb.href, className: "flex items-center space-x-2" },
                    index > 0 && (React.createElement(lucide_react_1.ChevronRight, { className: "w-4 h-4 text-gf-smoke" })),
                    React.createElement(wouter_1.Link, { href: crumb.href, className: `text-sm ${index === breadcrumbs.length - 1
                            ? "text-gf-snow font-medium"
                            : "text-gf-smoke hover:text-gf-snow"}` }, crumb.label))))))),
            isMobileMenuOpen && (React.createElement("div", { className: "lg:hidden border-t border-gf-smoke/20 bg-gf-ink" },
                React.createElement(scroll_area_1.ScrollArea, { className: "h-96" },
                    React.createElement("div", { className: "px-4 py-4 space-y-2" }, navigationItems.map((item) => (React.createElement(wouter_1.Link, { key: item.id, href: item.href },
                        React.createElement(button_1.Button, { variant: "ghost", className: `w-full justify-start text-left ${location === item.href ? "bg-gf-smoke/20" : ""}`, onClick: () => setIsMobileMenuOpen(false) },
                            React.createElement(item.icon, { className: "w-5 h-5 mr-3" }),
                            item.label,
                            item.badge && (React.createElement(badge_1.Badge, { className: "ml-auto bg-gf-cyan text-gf-ink text-xs" }, item.badge))))))))))),
        React.createElement(dialog_1.Dialog, { open: isCommandPaletteOpen, onOpenChange: setIsCommandPaletteOpen },
            React.createElement(dialog_1.DialogContent, { className: "sm:max-w-md bg-gf-ink border-gf-smoke/20" },
                React.createElement(dialog_1.DialogHeader, null,
                    React.createElement(dialog_1.DialogTitle, { className: "text-gf-snow flex items-center" },
                        React.createElement(lucide_react_1.Command, { className: "w-5 h-5 mr-2" }),
                        "Quick Actions")),
                React.createElement("div", { className: "space-y-4" },
                    React.createElement(input_1.Input, { placeholder: "Search commands...", value: commandSearch, onChange: (e) => setCommandSearch(e.target.value), className: "bg-gf-smoke/10 border-gf-smoke/20 text-gf-snow placeholder:text-gf-smoke", "data-testid": "input-command-search" }),
                    React.createElement(scroll_area_1.ScrollArea, { className: "h-80" },
                        React.createElement("div", { className: "space-y-4" },
                            Object.entries(groupedCommands).map(([group, commands]) => (React.createElement("div", { key: group },
                                React.createElement("h4", { className: "text-sm font-medium text-gf-smoke mb-2 capitalize" }, group),
                                React.createElement("div", { className: "space-y-1" }, commands.map((command) => (React.createElement(button_1.Button, { key: command.id, variant: "ghost", className: "w-full justify-start text-left hover:bg-gf-smoke/20", onClick: () => handleCommandSelect(command), "data-testid": `command-${command.id}` },
                                    React.createElement(command.icon, { className: "w-4 h-4 mr-3" }),
                                    command.label))))))),
                            filteredCommands.length === 0 && (React.createElement("div", { className: "text-center py-6 text-gf-smoke" }, "No commands found")))))))));
}
