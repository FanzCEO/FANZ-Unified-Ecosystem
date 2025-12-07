"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Verification = Verification;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const wouter_1 = require("wouter");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const form_1 = require("@/components/ui/form");
const select_1 = require("@/components/ui/select");
const tabs_1 = require("@/components/ui/tabs");
const alert_1 = require("@/components/ui/alert");
const badge_1 = require("@/components/ui/badge");
const use_toast_1 = require("@/hooks/use-toast");
const react_hook_form_1 = require("react-hook-form");
const zod_1 = require("@hookform/resolvers/zod");
const zod_2 = require("zod");
const lucide_react_1 = require("lucide-react");
const queryClient_1 = require("@/lib/queryClient");
const ageVerificationSchema = zod_2.z.object({
    firstName: zod_2.z.string().min(1, "First name is required"),
    lastName: zod_2.z.string().min(1, "Last name is required"),
    dateOfBirth: zod_2.z.string().min(1, "Date of birth is required"),
    ssn4: zod_2.z.string().optional(),
    phone: zod_2.z.string().optional(),
    address: zod_2.z.object({
        street: zod_2.z.string().min(1, "Street address is required"),
        city: zod_2.z.string().min(1, "City is required"),
        state: zod_2.z.string().min(1, "State is required"),
        zipCode: zod_2.z.string().min(1, "ZIP code is required"),
        country: zod_2.z.string().default("US")
    })
});
const identityVerificationSchema = zod_2.z.object({
    documentType: zod_2.z.enum(["drivers_license", "passport", "id_card"]),
    frontImageUrl: zod_2.z.string().min(1, "Front image is required"),
    backImageUrl: zod_2.z.string().optional(),
    selfieImageUrl: zod_2.z.string().min(1, "Selfie is required"),
    documentNumber: zod_2.z.string().optional()
});
function Verification() {
    const [, navigate] = (0, wouter_1.useLocation)();
    const { toast } = (0, use_toast_1.useToast)();
    const queryClient = (0, react_query_1.useQueryClient)();
    const [currentTab, setCurrentTab] = (0, react_1.useState)("status");
    // Get verification status
    const { data: verificationStatus, isLoading: statusLoading } = (0, react_query_1.useQuery)({
        queryKey: ["/api/verification/status"],
    });
    // Age verification form
    const ageForm = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(ageVerificationSchema),
        defaultValues: {
            address: {
                country: "US"
            }
        }
    });
    // Identity verification form
    const identityForm = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(identityVerificationSchema),
    });
    // Age verification mutation
    const ageVerificationMutation = (0, react_query_1.useMutation)({
        mutationFn: (data) => (0, queryClient_1.apiRequest)("/api/verification/age", "POST", data),
        onSuccess: (result) => {
            toast({
                title: "Age verification submitted",
                description: `Transaction ID: ${result.transactionId}. Status: ${result.status}`,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/verification/status"] });
            setCurrentTab("status");
        },
        onError: (error) => {
            toast({
                title: "Age verification failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    // Identity verification mutation
    const identityVerificationMutation = (0, react_query_1.useMutation)({
        mutationFn: (data) => (0, queryClient_1.apiRequest)("/api/verification/identity", "POST", data),
        onSuccess: (result) => {
            toast({
                title: "Identity verification submitted",
                description: `Transaction ID: ${result.transactionId}. Status: ${result.status}`,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/verification/status"] });
            setCurrentTab("status");
        },
        onError: (error) => {
            toast({
                title: "Identity verification failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    const getStatusIcon = (status) => {
        switch (status) {
            case 'verified':
                return React.createElement(lucide_react_1.CheckCircle, { className: "h-5 w-5 text-green-500" });
            case 'rejected':
                return React.createElement(lucide_react_1.XCircle, { className: "h-5 w-5 text-red-500" });
            case 'pending':
            default:
                return React.createElement(lucide_react_1.Clock, { className: "h-5 w-5 text-yellow-500" });
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'verified':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
            case 'pending':
            default:
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
        }
    };
    if (statusLoading) {
        return (React.createElement("div", { className: "container max-w-4xl mx-auto p-6" },
            React.createElement("div", { className: "flex items-center justify-center h-64" },
                React.createElement("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }))));
    }
    return (React.createElement("div", { className: "container max-w-4xl mx-auto p-6" },
        React.createElement("div", { className: "space-y-8" },
            React.createElement("div", { className: "text-center" },
                React.createElement("h1", { className: "text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent" }, "Account Verification"),
                React.createElement("p", { className: "text-muted-foreground mt-2" }, "Complete age and identity verification to access all platform features")),
            React.createElement(tabs_1.Tabs, { value: currentTab, onValueChange: setCurrentTab, className: "space-y-6" },
                React.createElement(tabs_1.TabsList, { className: "grid w-full grid-cols-3" },
                    React.createElement(tabs_1.TabsTrigger, { value: "status", className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.Shield, { className: "h-4 w-4" }),
                        "Status"),
                    React.createElement(tabs_1.TabsTrigger, { value: "age", className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.User, { className: "h-4 w-4" }),
                        "Age Verification"),
                    React.createElement(tabs_1.TabsTrigger, { value: "identity", className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.FileText, { className: "h-4 w-4" }),
                        "Identity Verification")),
                React.createElement(tabs_1.TabsContent, { value: "status", className: "space-y-6" },
                    React.createElement(card_1.Card, null,
                        React.createElement(card_1.CardHeader, null,
                            React.createElement(card_1.CardTitle, { className: "flex items-center gap-2" },
                                React.createElement(lucide_react_1.Shield, { className: "h-5 w-5" }),
                                "Verification Status"),
                            React.createElement(card_1.CardDescription, null, "Current status of your account verification")),
                        React.createElement(card_1.CardContent, { className: "space-y-4" },
                            React.createElement("div", { className: "flex items-center justify-between p-4 border rounded-lg" },
                                React.createElement("div", { className: "flex items-center gap-3" },
                                    React.createElement(lucide_react_1.User, { className: "h-5 w-5 text-muted-foreground" }),
                                    React.createElement("div", null,
                                        React.createElement("p", { className: "font-medium" }, "Age Verification"),
                                        React.createElement("p", { className: "text-sm text-muted-foreground" }, "Verify you are 18 or older"))),
                                React.createElement("div", { className: "flex items-center gap-2" },
                                    getStatusIcon((verificationStatus === null || verificationStatus === void 0 ? void 0 : verificationStatus.ageVerified) ? 'verified' : 'pending'),
                                    React.createElement(badge_1.Badge, { className: getStatusColor((verificationStatus === null || verificationStatus === void 0 ? void 0 : verificationStatus.ageVerified) ? 'verified' : 'pending') }, (verificationStatus === null || verificationStatus === void 0 ? void 0 : verificationStatus.ageVerified) ? 'Verified' : 'Pending'))),
                            React.createElement("div", { className: "flex items-center justify-between p-4 border rounded-lg" },
                                React.createElement("div", { className: "flex items-center gap-3" },
                                    React.createElement(lucide_react_1.FileText, { className: "h-5 w-5 text-muted-foreground" }),
                                    React.createElement("div", null,
                                        React.createElement("p", { className: "font-medium" }, "Identity Verification"),
                                        React.createElement("p", { className: "text-sm text-muted-foreground" }, "Verify your identity with documents"))),
                                React.createElement("div", { className: "flex items-center gap-2" },
                                    getStatusIcon((verificationStatus === null || verificationStatus === void 0 ? void 0 : verificationStatus.kycStatus) || 'pending'),
                                    React.createElement(badge_1.Badge, { className: getStatusColor((verificationStatus === null || verificationStatus === void 0 ? void 0 : verificationStatus.kycStatus) || 'pending') }, (verificationStatus === null || verificationStatus === void 0 ? void 0 : verificationStatus.kycStatus) || 'Pending'))),
                            (verificationStatus === null || verificationStatus === void 0 ? void 0 : verificationStatus.lastVerification) && (React.createElement(alert_1.Alert, null,
                                React.createElement(alert_1.AlertDescription, null,
                                    "Last verification attempt: ",
                                    new Date(verificationStatus.lastVerification.createdAt).toLocaleDateString())))))),
                React.createElement(tabs_1.TabsContent, { value: "age", className: "space-y-6" },
                    React.createElement(card_1.Card, null,
                        React.createElement(card_1.CardHeader, null,
                            React.createElement(card_1.CardTitle, null, "Age Verification"),
                            React.createElement(card_1.CardDescription, null, "Verify that you are 18 years or older using database verification")),
                        React.createElement(card_1.CardContent, null,
                            React.createElement(form_1.Form, Object.assign({}, ageForm),
                                React.createElement("form", { onSubmit: ageForm.handleSubmit((data) => ageVerificationMutation.mutate(data)), className: "space-y-4" },
                                    React.createElement("div", { className: "grid grid-cols-2 gap-4" },
                                        React.createElement(form_1.FormField, { control: ageForm.control, name: "firstName", render: ({ field }) => (React.createElement(form_1.FormItem, null,
                                                React.createElement(form_1.FormLabel, null, "First Name"),
                                                React.createElement(form_1.FormControl, null,
                                                    React.createElement(input_1.Input, Object.assign({}, field, { "data-testid": "input-first-name" }))),
                                                React.createElement(form_1.FormMessage, null))) }),
                                        React.createElement(form_1.FormField, { control: ageForm.control, name: "lastName", render: ({ field }) => (React.createElement(form_1.FormItem, null,
                                                React.createElement(form_1.FormLabel, null, "Last Name"),
                                                React.createElement(form_1.FormControl, null,
                                                    React.createElement(input_1.Input, Object.assign({}, field, { "data-testid": "input-last-name" }))),
                                                React.createElement(form_1.FormMessage, null))) })),
                                    React.createElement(form_1.FormField, { control: ageForm.control, name: "dateOfBirth", render: ({ field }) => (React.createElement(form_1.FormItem, null,
                                            React.createElement(form_1.FormLabel, null, "Date of Birth"),
                                            React.createElement(form_1.FormControl, null,
                                                React.createElement(input_1.Input, Object.assign({ type: "date" }, field, { "data-testid": "input-date-of-birth" }))),
                                            React.createElement(form_1.FormMessage, null))) }),
                                    React.createElement("div", { className: "grid grid-cols-2 gap-4" },
                                        React.createElement(form_1.FormField, { control: ageForm.control, name: "ssn4", render: ({ field }) => (React.createElement(form_1.FormItem, null,
                                                React.createElement(form_1.FormLabel, null, "Last 4 digits of SSN (optional)"),
                                                React.createElement(form_1.FormControl, null,
                                                    React.createElement(input_1.Input, Object.assign({}, field, { placeholder: "1234", maxLength: 4, "data-testid": "input-ssn4" }))),
                                                React.createElement(form_1.FormMessage, null))) }),
                                        React.createElement(form_1.FormField, { control: ageForm.control, name: "phone", render: ({ field }) => (React.createElement(form_1.FormItem, null,
                                                React.createElement(form_1.FormLabel, null, "Phone (optional)"),
                                                React.createElement(form_1.FormControl, null,
                                                    React.createElement(input_1.Input, Object.assign({}, field, { placeholder: "+1-555-123-4567", "data-testid": "input-phone" }))),
                                                React.createElement(form_1.FormMessage, null))) })),
                                    React.createElement("div", { className: "space-y-4" },
                                        React.createElement(label_1.Label, { className: "text-base font-medium" }, "Address"),
                                        React.createElement(form_1.FormField, { control: ageForm.control, name: "address.street", render: ({ field }) => (React.createElement(form_1.FormItem, null,
                                                React.createElement(form_1.FormLabel, null, "Street Address"),
                                                React.createElement(form_1.FormControl, null,
                                                    React.createElement(input_1.Input, Object.assign({}, field, { "data-testid": "input-street" }))),
                                                React.createElement(form_1.FormMessage, null))) }),
                                        React.createElement("div", { className: "grid grid-cols-2 gap-4" },
                                            React.createElement(form_1.FormField, { control: ageForm.control, name: "address.city", render: ({ field }) => (React.createElement(form_1.FormItem, null,
                                                    React.createElement(form_1.FormLabel, null, "City"),
                                                    React.createElement(form_1.FormControl, null,
                                                        React.createElement(input_1.Input, Object.assign({}, field, { "data-testid": "input-city" }))),
                                                    React.createElement(form_1.FormMessage, null))) }),
                                            React.createElement(form_1.FormField, { control: ageForm.control, name: "address.state", render: ({ field }) => (React.createElement(form_1.FormItem, null,
                                                    React.createElement(form_1.FormLabel, null, "State"),
                                                    React.createElement(form_1.FormControl, null,
                                                        React.createElement(input_1.Input, Object.assign({}, field, { placeholder: "CA", "data-testid": "input-state" }))),
                                                    React.createElement(form_1.FormMessage, null))) })),
                                        React.createElement(form_1.FormField, { control: ageForm.control, name: "address.zipCode", render: ({ field }) => (React.createElement(form_1.FormItem, null,
                                                React.createElement(form_1.FormLabel, null, "ZIP Code"),
                                                React.createElement(form_1.FormControl, null,
                                                    React.createElement(input_1.Input, Object.assign({}, field, { "data-testid": "input-zip" }))),
                                                React.createElement(form_1.FormMessage, null))) })),
                                    React.createElement(button_1.Button, { type: "submit", className: "w-full", disabled: ageVerificationMutation.isPending, "data-testid": "button-submit-age-verification" }, ageVerificationMutation.isPending ? "Verifying..." : "Submit Age Verification")))))),
                React.createElement(tabs_1.TabsContent, { value: "identity", className: "space-y-6" },
                    React.createElement(card_1.Card, null,
                        React.createElement(card_1.CardHeader, null,
                            React.createElement(card_1.CardTitle, null, "Identity Verification"),
                            React.createElement(card_1.CardDescription, null, "Upload government-issued ID and selfie for identity verification")),
                        React.createElement(card_1.CardContent, null,
                            React.createElement(form_1.Form, Object.assign({}, identityForm),
                                React.createElement("form", { onSubmit: identityForm.handleSubmit((data) => identityVerificationMutation.mutate(data)), className: "space-y-4" },
                                    React.createElement(form_1.FormField, { control: identityForm.control, name: "documentType", render: ({ field }) => (React.createElement(form_1.FormItem, null,
                                            React.createElement(form_1.FormLabel, null, "Document Type"),
                                            React.createElement(select_1.Select, { onValueChange: field.onChange, defaultValue: field.value },
                                                React.createElement(form_1.FormControl, null,
                                                    React.createElement(select_1.SelectTrigger, { "data-testid": "select-document-type" },
                                                        React.createElement(select_1.SelectValue, { placeholder: "Select document type" }))),
                                                React.createElement(select_1.SelectContent, null,
                                                    React.createElement(select_1.SelectItem, { value: "drivers_license" }, "Driver's License"),
                                                    React.createElement(select_1.SelectItem, { value: "passport" }, "Passport"),
                                                    React.createElement(select_1.SelectItem, { value: "id_card" }, "State ID Card"))),
                                            React.createElement(form_1.FormMessage, null))) }),
                                    React.createElement(form_1.FormField, { control: identityForm.control, name: "frontImageUrl", render: ({ field }) => (React.createElement(form_1.FormItem, null,
                                            React.createElement(form_1.FormLabel, null, "Front of Document"),
                                            React.createElement(form_1.FormControl, null,
                                                React.createElement("div", { className: "flex items-center gap-2" },
                                                    React.createElement(input_1.Input, Object.assign({}, field, { placeholder: "Upload front image URL", "data-testid": "input-front-image" })),
                                                    React.createElement(button_1.Button, { type: "button", variant: "outline", size: "sm" },
                                                        React.createElement(lucide_react_1.Camera, { className: "h-4 w-4" })))),
                                            React.createElement(form_1.FormMessage, null))) }),
                                    identityForm.watch("documentType") === "drivers_license" && (React.createElement(form_1.FormField, { control: identityForm.control, name: "backImageUrl", render: ({ field }) => (React.createElement(form_1.FormItem, null,
                                            React.createElement(form_1.FormLabel, null, "Back of Driver's License"),
                                            React.createElement(form_1.FormControl, null,
                                                React.createElement("div", { className: "flex items-center gap-2" },
                                                    React.createElement(input_1.Input, Object.assign({}, field, { placeholder: "Upload back image URL", "data-testid": "input-back-image" })),
                                                    React.createElement(button_1.Button, { type: "button", variant: "outline", size: "sm" },
                                                        React.createElement(lucide_react_1.Camera, { className: "h-4 w-4" })))),
                                            React.createElement(form_1.FormMessage, null))) })),
                                    React.createElement(form_1.FormField, { control: identityForm.control, name: "selfieImageUrl", render: ({ field }) => (React.createElement(form_1.FormItem, null,
                                            React.createElement(form_1.FormLabel, null, "Selfie Photo"),
                                            React.createElement(form_1.FormControl, null,
                                                React.createElement("div", { className: "flex items-center gap-2" },
                                                    React.createElement(input_1.Input, Object.assign({}, field, { placeholder: "Upload selfie URL", "data-testid": "input-selfie-image" })),
                                                    React.createElement(button_1.Button, { type: "button", variant: "outline", size: "sm" },
                                                        React.createElement(lucide_react_1.Camera, { className: "h-4 w-4" })))),
                                            React.createElement(form_1.FormMessage, null))) }),
                                    React.createElement(form_1.FormField, { control: identityForm.control, name: "documentNumber", render: ({ field }) => (React.createElement(form_1.FormItem, null,
                                            React.createElement(form_1.FormLabel, null, "Document Number (optional)"),
                                            React.createElement(form_1.FormControl, null,
                                                React.createElement(input_1.Input, Object.assign({}, field, { placeholder: "License/ID number", "data-testid": "input-document-number" }))),
                                            React.createElement(form_1.FormMessage, null))) }),
                                    React.createElement(alert_1.Alert, null,
                                        React.createElement(lucide_react_1.Shield, { className: "h-4 w-4" }),
                                        React.createElement(alert_1.AlertDescription, null, "Your documents are encrypted and processed securely by our verification partner. Images are deleted after verification is complete.")),
                                    React.createElement(button_1.Button, { type: "submit", className: "w-full", disabled: identityVerificationMutation.isPending, "data-testid": "button-submit-identity-verification" }, identityVerificationMutation.isPending ? "Verifying..." : "Submit Identity Verification"))))))))));
}
