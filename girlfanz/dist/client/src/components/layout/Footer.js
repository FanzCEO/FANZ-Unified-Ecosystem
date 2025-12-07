"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Footer = Footer;
const wouter_1 = require("wouter");
const logo_jpg_1 = __importDefault(require("@/assets/logo.jpg"));
function Footer() {
    const currentYear = new Date().getFullYear();
    const footerLinks = {
        platform: [
            { name: "For Creators", href: "/creators" },
            { name: "For Fans", href: "/fans" },
            { name: "Pricing", href: "/pricing" },
            { name: "Features", href: "/features" },
        ],
        support: [
            { name: "Help Center", href: "/help" },
            { name: "Safety Center", href: "/safety" },
            { name: "Community Guidelines", href: "/guidelines" },
            { name: "Contact Us", href: "/contact" },
        ],
        company: [
            { name: "About", href: "/about" },
            { name: "Careers", href: "/careers" },
            { name: "Press", href: "/press" },
            { name: "Blog", href: "/blog" },
        ],
        legal: [
            { name: "Privacy Policy", href: "/privacy" },
            { name: "Terms of Service", href: "/terms" },
            { name: "Cookie Policy", href: "/cookies" },
            { name: "2257 Compliance", href: "/compliance" },
        ],
    };
    const socialLinks = [
        { name: "Twitter", icon: "𝕏", href: "https://twitter.com/girlfanz" },
        { name: "Instagram", icon: "📷", href: "https://instagram.com/girlfanz" },
        { name: "TikTok", icon: "🎵", href: "https://tiktok.com/@girlfanz" },
        { name: "Discord", icon: "💬", href: "https://discord.gg/girlfanz" },
    ];
    return (React.createElement("footer", { className: "bg-gf-graphite border-t border-gf-smoke/20 relative overflow-hidden" },
        React.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-gf-ink via-gf-graphite to-transparent opacity-50" }),
        React.createElement("div", { className: "relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" },
            React.createElement("div", { className: "grid lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 gap-8 mb-12" },
                React.createElement("div", { className: "lg:col-span-1 sm:col-span-2" },
                    React.createElement(wouter_1.Link, { href: "/", className: "flex items-center space-x-3 mb-6" },
                        React.createElement("img", { src: logo_jpg_1.default, alt: "GirlFanz", className: "h-36 w-auto", "data-testid": "img-footer-logo" })),
                    React.createElement("p", { className: "text-gf-smoke text-sm leading-relaxed mb-6" }, "The premier platform where fierce female creators connect with devoted fans. Join the cyber-glam revolution and build your empire."),
                    React.createElement("div", { className: "flex space-x-4" }, socialLinks.map((social) => (React.createElement("a", { key: social.name, href: social.href, target: "_blank", rel: "noopener noreferrer", className: "w-10 h-10 bg-gf-ink rounded-lg flex items-center justify-center text-gf-smoke hover:text-gf-pink hover:bg-gf-pink/10 transition-colors", "data-testid": `link-social-${social.name.toLowerCase()}` },
                        React.createElement("span", { className: "text-lg" }, social.icon)))))),
                React.createElement("div", null,
                    React.createElement("h4", { className: "font-display font-semibold text-gf-snow mb-4 neon-cyan" }, "Platform"),
                    React.createElement("ul", { className: "space-y-3" }, footerLinks.platform.map((link) => (React.createElement("li", { key: link.name },
                        React.createElement(wouter_1.Link, { href: link.href, className: "text-gf-smoke hover:text-gf-cyan transition-colors text-sm", "data-testid": `link-${link.name.toLowerCase().replace(/\s+/g, '-')}` }, link.name)))))),
                React.createElement("div", null,
                    React.createElement("h4", { className: "font-display font-semibold text-gf-snow mb-4 neon-violet" }, "Support"),
                    React.createElement("ul", { className: "space-y-3" }, footerLinks.support.map((link) => (React.createElement("li", { key: link.name },
                        React.createElement(wouter_1.Link, { href: link.href, className: "text-gf-smoke hover:text-gf-violet transition-colors text-sm", "data-testid": `link-${link.name.toLowerCase().replace(/\s+/g, '-')}` }, link.name)))))),
                React.createElement("div", null,
                    React.createElement("h4", { className: "font-display font-semibold text-gf-snow mb-4 neon-pink" }, "Company"),
                    React.createElement("ul", { className: "space-y-3" }, footerLinks.company.map((link) => (React.createElement("li", { key: link.name },
                        React.createElement(wouter_1.Link, { href: link.href, className: "text-gf-smoke hover:text-gf-pink transition-colors text-sm", "data-testid": `link-${link.name.toLowerCase().replace(/\s+/g, '-')}` }, link.name)))))),
                React.createElement("div", null,
                    React.createElement("h4", { className: "font-display font-semibold text-gf-snow mb-4 neon-snow" }, "Legal"),
                    React.createElement("ul", { className: "space-y-3" }, footerLinks.legal.map((link) => (React.createElement("li", { key: link.name },
                        React.createElement(wouter_1.Link, { href: link.href, className: "text-gf-smoke hover:text-gf-snow transition-colors text-sm", "data-testid": `link-${link.name.toLowerCase().replace(/\s+/g, '-')}` }, link.name))))))),
            React.createElement("div", { className: "pt-8 border-t border-gf-smoke/20 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0" },
                React.createElement("div", { className: "flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6" },
                    React.createElement("p", { className: "text-gf-smoke text-sm" },
                        "\u00A9 ",
                        currentYear,
                        " GirlFanz. All rights reserved."),
                    React.createElement("div", { className: "flex items-center space-x-4 text-xs text-gf-smoke" },
                        React.createElement("span", { className: "flex items-center" },
                            React.createElement("span", { className: "w-2 h-2 bg-success rounded-full mr-2 animate-pulse" }),
                            "Platform Status: Operational"),
                        React.createElement("span", null, "18+ Only"))),
                React.createElement("div", { className: "flex items-center space-x-4 text-xs text-gf-smoke" },
                    React.createElement("span", null, "Built with \uD83D\uDC9C in the cyber-verse"),
                    React.createElement(wouter_1.Link, { href: "/compliance", className: "hover:text-gf-pink transition-colors", "data-testid": "link-compliance-notice" }, "Age Verification Required"))))));
}
