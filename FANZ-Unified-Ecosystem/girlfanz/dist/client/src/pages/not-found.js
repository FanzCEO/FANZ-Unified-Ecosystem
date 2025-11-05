"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NotFound;
const card_1 = require("@/components/ui/card");
const lucide_react_1 = require("lucide-react");
function NotFound() {
    return (React.createElement("div", { className: "min-h-screen w-full flex items-center justify-center bg-gray-50" },
        React.createElement(card_1.Card, { className: "w-full max-w-md mx-4" },
            React.createElement(card_1.CardContent, { className: "pt-6" },
                React.createElement("div", { className: "flex mb-4 gap-2" },
                    React.createElement(lucide_react_1.AlertCircle, { className: "h-8 w-8 text-red-500" }),
                    React.createElement("h1", { className: "text-2xl font-bold text-gray-900" }, "404 Page Not Found")),
                React.createElement("p", { className: "mt-4 text-sm text-gray-600" }, "Did you forget to add the page to the router?")))));
}
