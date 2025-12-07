"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Header = Header;
const react_1 = require("react");
const wouter_1 = require("wouter");
const lucide_react_1 = require("lucide-react");
const logo_jpg_1 = __importDefault(require("@/assets/logo.jpg"));
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const badge_1 = require("@/components/ui/badge");
const sheet_1 = require("@/components/ui/sheet");
const AuthModal_1 = require("@/components/auth/AuthModal");
const useAuth_1 = require("@/hooks/useAuth");
function Header() {
    const { user, isAuthenticated } = (0, useAuth_1.useAuth)();
    const [showAuthModal, setShowAuthModal] = (0, react_1.useState)(false);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)("");
    const navigation = [
        { name: "Discover", href: "/discover" },
        { name: "Following", href: "/following" },
        { name: "Messages", href: "/messages" },
        { name: "Live", href: "/live" },
    ];
    return (React.createElement(React.Fragment, null,
        React.createElement("header", { className: "sticky top-0 z-50 glass-overlay border-b border-gf-graphite backdrop-blur-lg" },
            React.createElement("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" },
                React.createElement("div", { className: "flex items-center justify-between h-16" },
                    React.createElement("div", { className: "flex items-center space-x-8" },
                        React.createElement(wouter_1.Link, { href: "/", className: "flex items-center space-x-2" },
                            React.createElement("img", { src: logo_jpg_1.default, alt: "GirlFanz", className: "h-30 w-auto", "data-testid": "img-logo" })),
                        React.createElement("nav", { className: "hidden md:flex space-x-6" }, navigation.map((item) => (React.createElement(wouter_1.Link, { key: item.name, href: item.href, className: "text-gf-smoke hover:text-gf-pink transition-colors", "data-testid": `link-${item.name.toLowerCase()}` }, item.name))))),
                    React.createElement("div", { className: "flex items-center space-x-3" },
                        React.createElement("div", { className: "relative hidden sm:block" },
                            React.createElement(input_1.Input, { type: "text", placeholder: "Search creators...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke w-64 pl-10 focus:border-gf-pink", "data-testid": "input-search" }),
                            React.createElement(lucide_react_1.Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gf-smoke h-4 w-4" })),
                        isAuthenticated ? (React.createElement(React.Fragment, null,
                            React.createElement(button_1.Button, { variant: "ghost", size: "icon", className: "relative text-gf-smoke hover:text-gf-cyan", "data-testid": "button-notifications" },
                                React.createElement(lucide_react_1.Bell, { className: "h-5 w-5" }),
                                React.createElement(badge_1.Badge, { className: "absolute -top-1 -right-1 bg-gf-pink text-xs h-5 w-5 flex items-center justify-center p-0" }, "3")),
                            React.createElement("div", { className: "flex items-center space-x-3" },
                                React.createElement("img", { src: (user === null || user === void 0 ? void 0 : user.profileImageUrl) || "/api/placeholder/40/40", alt: "Profile", className: "w-8 h-8 rounded-full", "data-testid": "img-profile-avatar" }),
                                React.createElement(button_1.Button, { onClick: () => window.location.href = "/api/logout", variant: "outline", className: "text-gf-snow border-gf-violet hover:bg-gf-violet/10", "data-testid": "button-logout" }, "Sign Out")))) : (React.createElement(React.Fragment, null,
                            React.createElement(button_1.Button, { onClick: () => setShowAuthModal(true), className: "bg-gf-gradient text-gf-snow hover:shadow-glow-pink", "data-testid": "button-create-account" }, "Create Account"),
                            React.createElement(button_1.Button, { onClick: () => setShowAuthModal(true), variant: "outline", className: "text-gf-snow border-gf-violet hover:bg-gf-violet/10", "data-testid": "button-signin" }, "Sign In"))),
                        React.createElement(sheet_1.Sheet, null,
                            React.createElement(sheet_1.SheetTrigger, { asChild: true },
                                React.createElement(button_1.Button, { variant: "ghost", size: "icon", className: "md:hidden text-gf-smoke" },
                                    React.createElement(lucide_react_1.Menu, { className: "h-5 w-5" }))),
                            React.createElement(sheet_1.SheetContent, { className: "bg-gf-graphite border-gf-smoke/20" },
                                React.createElement("nav", { className: "space-y-4 mt-8" }, navigation.map((item) => (React.createElement(wouter_1.Link, { key: item.name, href: item.href, className: "block text-gf-smoke hover:text-gf-pink transition-colors py-2" }, item.name)))))))))),
        React.createElement(AuthModal_1.AuthModal, { isOpen: showAuthModal, onClose: () => setShowAuthModal(false) })));
}
