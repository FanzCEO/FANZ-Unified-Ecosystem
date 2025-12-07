"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModal = AuthModal;
const react_1 = require("react");
const dialog_1 = require("@/components/ui/dialog");
const logo_jpg_1 = __importDefault(require("@/assets/logo.jpg"));
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const tabs_1 = require("@/components/ui/tabs");
const use_toast_1 = require("@/hooks/use-toast");
const queryClient_1 = require("@/lib/queryClient");
const wouter_1 = require("wouter");
function AuthModal({ isOpen, onClose }) {
    const [, setLocation] = (0, wouter_1.useLocation)();
    const { toast } = (0, use_toast_1.useToast)();
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [showForgotPassword, setShowForgotPassword] = (0, react_1.useState)(false);
    const [showForgotEmail, setShowForgotEmail] = (0, react_1.useState)(false);
    const [formData, setFormData] = (0, react_1.useState)({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        securityQuestion: "",
        securityAnswer: "",
        rememberMe: false,
    });
    const handleLogin = async () => {
        setIsLoading(true);
        try {
            const response = await (0, queryClient_1.apiRequest)("POST", "/api/auth/login", {
                email: formData.email,
                password: formData.password,
            });
            const data = await response.json();
            // Store JWT token in localStorage
            localStorage.setItem("auth_token", data.token);
            // Invalidate auth query to refetch user
            await queryClient_1.queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            toast({
                title: "Welcome back!",
                description: "You have successfully logged in.",
            });
            onClose();
        }
        catch (error) {
            toast({
                title: "Login Failed",
                description: error.message || "Invalid email or password",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleRegister = async () => {
        setIsLoading(true);
        try {
            const response = await (0, queryClient_1.apiRequest)("POST", "/api/auth/register", {
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                securityQuestion: formData.securityQuestion,
                securityAnswer: formData.securityAnswer,
                isCreator: false,
            });
            const data = await response.json();
            // Store JWT token in localStorage
            localStorage.setItem("auth_token", data.token);
            // Invalidate auth query to refetch user
            await queryClient_1.queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            toast({
                title: "Account Created!",
                description: "Please check your email to verify your account.",
            });
            onClose();
            setLocation("/feed");
        }
        catch (error) {
            toast({
                title: "Registration Failed",
                description: error.message || "Could not create account",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleForgotPassword = async () => {
        setIsLoading(true);
        try {
            await (0, queryClient_1.apiRequest)("POST", "/api/auth/forgot-password", {
                email: formData.email,
            });
            toast({
                title: "Password Reset Email Sent",
                description: "Check your email for a password reset link.",
            });
            setShowForgotPassword(false);
        }
        catch (error) {
            toast({
                title: "Error",
                description: error.message || "Could not send reset email",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleForgotEmail = async () => {
        setIsLoading(true);
        try {
            const response = await (0, queryClient_1.apiRequest)("POST", "/api/auth/recover-email", {
                securityQuestion: formData.securityQuestion,
                securityAnswer: formData.securityAnswer,
            });
            const data = await response.json();
            toast({
                title: "Email Found",
                description: data.hint || "Check the information provided",
            });
            setShowForgotEmail(false);
        }
        catch (error) {
            toast({
                title: "Email Recovery Failed",
                description: error.message || "Could not recover email",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    return (React.createElement(dialog_1.Dialog, { open: isOpen, onOpenChange: onClose },
        React.createElement(dialog_1.DialogContent, { className: "sm:max-w-md bg-gf-graphite border-gf-smoke/20" },
            React.createElement(dialog_1.DialogHeader, null,
                React.createElement(dialog_1.DialogTitle, { className: "text-center font-display text-2xl text-gf-snow mb-2 flex flex-col items-center" },
                    React.createElement("img", { src: logo_jpg_1.default, alt: "GirlFanz", className: "h-36 w-auto mb-2", "data-testid": "img-auth-logo" }),
                    "Welcome to the Revolution"),
                React.createElement("p", { className: "text-center text-gf-smoke" }, "Join the cyber-glam creator revolution")),
            React.createElement(tabs_1.Tabs, { defaultValue: "signin", className: "w-full" },
                React.createElement(tabs_1.TabsList, { className: "grid w-full grid-cols-2 bg-gf-graphite" },
                    React.createElement(tabs_1.TabsTrigger, { value: "signin", className: "data-[state=active]:bg-gf-pink data-[state=active]:text-gf-snow" }, "Sign In"),
                    React.createElement(tabs_1.TabsTrigger, { value: "signup", className: "data-[state=active]:bg-gf-pink data-[state=active]:text-gf-snow" }, "Sign Up")),
                React.createElement(tabs_1.TabsContent, { value: "signin", className: "space-y-4 mt-6" },
                    React.createElement("div", { className: "space-y-2" },
                        React.createElement(label_1.Label, { htmlFor: "signin-email", className: "text-gf-smoke" }, "Email"),
                        React.createElement(input_1.Input, { id: "signin-email", type: "email", placeholder: "Email address", value: formData.email, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { email: e.target.value })), className: "bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink", "data-testid": "input-signin-email" })),
                    React.createElement("div", { className: "space-y-2" },
                        React.createElement(label_1.Label, { htmlFor: "signin-password", className: "text-gf-smoke" }, "Password"),
                        React.createElement(input_1.Input, { id: "signin-password", type: "password", placeholder: "Password", value: formData.password, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { password: e.target.value })), className: "bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink", "data-testid": "input-signin-password" })),
                    React.createElement("div", { className: "flex items-center justify-between text-sm" },
                        React.createElement("button", { type: "button", onClick: () => setShowForgotEmail(true), className: "text-gf-pink hover:text-gf-violet" }, "Forgot email?"),
                        React.createElement("button", { type: "button", onClick: () => setShowForgotPassword(true), className: "text-gf-pink hover:text-gf-violet" }, "Forgot password?")),
                    React.createElement(button_1.Button, { onClick: handleLogin, disabled: isLoading || !formData.email || !formData.password, className: "w-full bg-gf-gradient text-gf-snow hover:shadow-glow-pink", "data-testid": "button-signin" }, isLoading ? "Signing in..." : "Sign In")),
                React.createElement(tabs_1.TabsContent, { value: "signup", className: "space-y-3 max-h-[500px] overflow-y-auto" },
                    React.createElement("div", { className: "grid grid-cols-2 gap-3" },
                        React.createElement("div", { className: "space-y-2" },
                            React.createElement(label_1.Label, { htmlFor: "signup-firstname", className: "text-gf-smoke text-sm" }, "First Name"),
                            React.createElement(input_1.Input, { id: "signup-firstname", type: "text", placeholder: "First name", value: formData.firstName, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { firstName: e.target.value })), className: "bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink", "data-testid": "input-signup-firstname" })),
                        React.createElement("div", { className: "space-y-2" },
                            React.createElement(label_1.Label, { htmlFor: "signup-lastname", className: "text-gf-smoke text-sm" }, "Last Name"),
                            React.createElement(input_1.Input, { id: "signup-lastname", type: "text", placeholder: "Last name", value: formData.lastName, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { lastName: e.target.value })), className: "bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink", "data-testid": "input-signup-lastname" }))),
                    React.createElement("div", { className: "space-y-2" },
                        React.createElement(label_1.Label, { htmlFor: "signup-email", className: "text-gf-smoke text-sm" }, "Email"),
                        React.createElement(input_1.Input, { id: "signup-email", type: "email", placeholder: "Email address", value: formData.email, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { email: e.target.value })), className: "bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink", "data-testid": "input-signup-email" })),
                    React.createElement("div", { className: "space-y-2" },
                        React.createElement(label_1.Label, { htmlFor: "signup-password", className: "text-gf-smoke text-sm" }, "Password"),
                        React.createElement(input_1.Input, { id: "signup-password", type: "password", placeholder: "Create a password (min 8 characters)", value: formData.password, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { password: e.target.value })), className: "bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink", "data-testid": "input-signup-password" })),
                    React.createElement("div", { className: "space-y-2" },
                        React.createElement(label_1.Label, { htmlFor: "security-question", className: "text-gf-smoke text-sm" }, "Security Question (for email recovery)"),
                        React.createElement(input_1.Input, { id: "security-question", type: "text", placeholder: "e.g., What is your mother's maiden name?", value: formData.securityQuestion, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { securityQuestion: e.target.value })), className: "bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink", "data-testid": "input-security-question" })),
                    React.createElement("div", { className: "space-y-2" },
                        React.createElement(label_1.Label, { htmlFor: "security-answer", className: "text-gf-smoke text-sm" }, "Security Answer"),
                        React.createElement(input_1.Input, { id: "security-answer", type: "text", placeholder: "Your answer", value: formData.securityAnswer, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { securityAnswer: e.target.value })), className: "bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink", "data-testid": "input-security-answer" })),
                    React.createElement(button_1.Button, { onClick: handleRegister, disabled: isLoading || !formData.email || !formData.password || formData.password.length < 8, className: "w-full bg-gf-gradient text-gf-snow hover:shadow-glow-pink mt-4", "data-testid": "button-signup" }, isLoading ? "Creating account..." : "Create Account"))),
            React.createElement("div", { className: "text-center text-sm text-gf-smoke" },
                "By continuing, you agree to our",
                " ",
                React.createElement("a", { href: "#", className: "text-gf-pink" }, "Terms"),
                " and",
                " ",
                React.createElement("a", { href: "#", className: "text-gf-pink" }, "Privacy Policy")))));
}
