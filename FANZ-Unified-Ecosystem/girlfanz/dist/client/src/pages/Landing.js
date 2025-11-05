"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Landing;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const AuthModal_1 = require("@/components/auth/AuthModal");
const Footer_1 = require("@/components/layout/Footer");
const Girlsbackgroud2_1759228216281_png_1 = __importDefault(require("@assets/Girlsbackgroud2_1759228216281.png"));
const Girlsbackground_1759151738593_png_1 = __importDefault(require("@assets/Girlsbackground_1759151738593.png"));
function Landing() {
    const [showAuthModal, setShowAuthModal] = (0, react_1.useState)(false);
    const stats = [
        { value: "50K+", label: "Active Creators" },
        { value: "2M+", label: "Loyal Fans" },
        { value: "$100M+", label: "Earned by Creators" },
    ];
    return (React.createElement(React.Fragment, null,
        React.createElement("section", { className: "relative bg-gf-hero overflow-hidden" },
            React.createElement("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24" },
                React.createElement("div", { className: "grid lg:grid-cols-2 gap-12 items-center" },
                    React.createElement("div", { className: "space-y-8" },
                        React.createElement("h1", { className: "font-display font-bold text-3xl sm:text-4xl md:text-5xl lg:text-7xl leading-tight" },
                            React.createElement("span", { className: "text-gf-snow" }, "Feminine"),
                            React.createElement("br", null),
                            React.createElement("span", { className: "bg-heatwave bg-clip-text text-transparent glow-text" }, "but Ferocious")),
                        React.createElement("p", { className: "text-base sm:text-lg md:text-xl text-gf-smoke leading-relaxed" }, "Join the premier platform where fierce female creators connect with devoted fans. Build your empire in the cyber-glam universe of GirlFanz."),
                        React.createElement("div", { className: "flex flex-col sm:flex-row gap-4" },
                            React.createElement(button_1.Button, { onClick: () => setShowAuthModal(true), className: "bg-gf-gradient text-gf-snow px-8 py-4 text-lg font-display font-semibold hover:shadow-glow-pink", "data-testid": "button-start-creating" }, "Start Creating"),
                            React.createElement(button_1.Button, { onClick: () => setShowAuthModal(true), variant: "outline", className: "border-gf-violet text-gf-violet px-8 py-4 text-lg font-display font-semibold hover:bg-gf-violet/10", "data-testid": "button-explore-creators" }, "Explore Creators")),
                        React.createElement("div", { className: "flex flex-wrap items-center gap-4 sm:gap-6 md:gap-8 pt-8" }, stats.map((stat, index) => (React.createElement("div", { key: index, className: "text-center min-w-[80px]" },
                            React.createElement("div", { className: "font-display font-bold text-xl sm:text-2xl text-gf-pink", "data-testid": `stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}` }, stat.value),
                            React.createElement("div", { className: "text-gf-smoke text-sm" }, stat.label)))))),
                    React.createElement("div", { className: "relative mt-8 lg:mt-0" },
                        React.createElement("div", { className: "relative rounded-2xl overflow-hidden shadow-2xl" },
                            React.createElement("img", { src: Girlsbackground_1759151738593_png_1.default, alt: "Confident creator in neon cyber-glam setting", className: "w-full h-auto" }),
                            React.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-gf-pink/20 via-transparent to-gf-violet/20" })),
                        React.createElement("div", { className: "hidden sm:block absolute -top-6 -right-6 glass-overlay rounded-lg p-3 sm:p-4", "data-testid": "card-earnings-preview" },
                            React.createElement("div", { className: "text-gf-pink font-display font-bold" }, "$12,450"),
                            React.createElement("div", { className: "text-gf-smoke text-sm" }, "Monthly earnings")),
                        React.createElement("div", { className: "hidden sm:block absolute -bottom-6 -left-6 glass-overlay rounded-lg p-3 sm:p-4", "data-testid": "card-live-status" },
                            React.createElement("div", { className: "flex items-center space-x-2" },
                                React.createElement("div", { className: "w-3 h-3 bg-success rounded-full animate-pulse" }),
                                React.createElement("span", { className: "text-gf-snow text-sm" }, "Live streaming"))))))),
        React.createElement("section", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24" },
            React.createElement("div", { className: "text-center mb-16" },
                React.createElement("h2", { className: "font-display font-bold text-2xl sm:text-3xl md:text-4xl text-gf-snow mb-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4" },
                    "Why Choose",
                    React.createElement("img", { src: Girlsbackgroud2_1759228216281_png_1.default, alt: "GirlFanz", className: "h-24 sm:h-32 md:h-40 w-auto rounded-lg object-cover", "data-testid": "img-features-logo" }),
                    "?"),
                React.createElement("p", { className: "text-base sm:text-lg md:text-xl text-gf-smoke" }, "Built specifically for fierce female creators who demand the best")),
            React.createElement("div", { className: "grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8" },
                React.createElement("div", { className: "glass-overlay rounded-2xl p-8 text-center" },
                    React.createElement("div", { className: "w-16 h-16 bg-gf-gradient rounded-full flex items-center justify-center mx-auto mb-6" },
                        React.createElement("span", { className: "text-2xl" }, "\uD83D\uDCB0")),
                    React.createElement("h3", { className: "font-display font-bold text-xl text-gf-snow mb-4" }, "Maximum Earnings"),
                    React.createElement("p", { className: "text-gf-smoke" }, "Keep 100% of your earnings with our creator-first revenue model. No hidden fees, just transparent payouts.")),
                React.createElement("div", { className: "glass-overlay rounded-2xl p-8 text-center" },
                    React.createElement("div", { className: "w-16 h-16 bg-gf-gradient rounded-full flex items-center justify-center mx-auto mb-6" },
                        React.createElement("span", { className: "text-2xl" }, "\uD83D\uDEE1\uFE0F")),
                    React.createElement("h3", { className: "font-display font-bold text-xl text-gf-snow mb-4" }, "Ultimate Protection"),
                    React.createElement("p", { className: "text-gf-smoke" }, "Advanced content protection with watermarking, DRM, and anti-piracy measures to keep your content safe.")),
                React.createElement("div", { className: "glass-overlay rounded-2xl p-8 text-center" },
                    React.createElement("div", { className: "w-16 h-16 bg-gf-gradient rounded-full flex items-center justify-center mx-auto mb-6" },
                        React.createElement("span", { className: "text-2xl" }, "\u26A1")),
                    React.createElement("h3", { className: "font-display font-bold text-xl text-gf-snow mb-4" }, "Real-Time Connection"),
                    React.createElement("p", { className: "text-gf-smoke" }, "Live streaming, instant messaging, and real-time notifications keep you connected with your audience.")))),
        React.createElement(Footer_1.Footer, null),
        React.createElement(AuthModal_1.AuthModal, { isOpen: showAuthModal, onClose: () => setShowAuthModal(false) })));
}
