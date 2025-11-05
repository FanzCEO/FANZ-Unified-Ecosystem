"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = VerificationModal;
const react_1 = require("react");
const dialog_1 = require("@/components/ui/dialog");
const button_1 = require("@/components/ui/button");
const alert_1 = require("@/components/ui/alert");
const card_1 = require("@/components/ui/card");
const progress_1 = require("@/components/ui/progress");
const use_toast_1 = require("@/hooks/use-toast");
const react_query_1 = require("@tanstack/react-query");
const queryClient_1 = require("@/lib/queryClient");
const lucide_react_1 = require("lucide-react");
const IDUpload_1 = __importDefault(require("./IDUpload"));
const SelfieCapture_1 = __importDefault(require("./SelfieCapture"));
function VerificationModal({ open, onClose, onSuccess, mandatory = false, userType = 'creator' }) {
    const [currentStep, setCurrentStep] = (0, react_1.useState)('intro');
    const [documentData, setDocumentData] = (0, react_1.useState)(null);
    const [selfieData, setSelfieData] = (0, react_1.useState)(null);
    const [verificationId, setVerificationId] = (0, react_1.useState)(null);
    const { toast } = (0, use_toast_1.useToast)();
    // Check existing verification status
    const { data: verificationStatus } = (0, react_query_1.useQuery)({
        queryKey: ['/api/verification/status'],
        enabled: open,
    });
    // Create verification session
    const createSessionMutation = (0, react_query_1.useMutation)({
        mutationFn: () => (0, queryClient_1.apiRequest)('/api/verification/session', {
            method: 'POST',
            body: { userType }
        }),
        onSuccess: (data) => {
            setVerificationId(data.sessionId);
            setCurrentStep('document');
        },
        onError: () => {
            toast({
                title: 'Error',
                description: 'Failed to start verification process',
                variant: 'destructive'
            });
        }
    });
    // Submit verification
    const submitVerificationMutation = (0, react_query_1.useMutation)({
        mutationFn: () => {
            if (!documentData || !selfieData || !verificationId) {
                throw new Error('Missing verification data');
            }
            return (0, queryClient_1.apiRequest)(`/api/verification/submit/${verificationId}`, {
                method: 'POST',
                body: {
                    documentType: documentData.type,
                    frontImageBase64: documentData.frontImage,
                    backImageBase64: documentData.backImage,
                    selfieImageBase64: selfieData,
                }
            });
        },
        onSuccess: (data) => {
            if (data.status === 'verified') {
                setCurrentStep('complete');
                queryClient_1.queryClient.invalidateQueries({ queryKey: ['/api/verification/status'] });
                queryClient_1.queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
                setTimeout(() => {
                    onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess();
                    if (!mandatory)
                        onClose();
                }, 2000);
            }
            else if (data.status === 'rejected') {
                setCurrentStep('failed');
            }
            else {
                // Review required
                setCurrentStep('processing');
            }
        },
        onError: () => {
            setCurrentStep('failed');
            toast({
                title: 'Verification Failed',
                description: 'Unable to verify your identity. Please try again.',
                variant: 'destructive'
            });
        }
    });
    // Check verification result
    const { data: verificationResult } = (0, react_query_1.useQuery)({
        queryKey: [`/api/verification/result/${verificationId}`],
        enabled: currentStep === 'processing' && !!verificationId,
        refetchInterval: 3000, // Poll every 3 seconds
    });
    (0, react_1.useEffect)(() => {
        if ((verificationResult === null || verificationResult === void 0 ? void 0 : verificationResult.status) === 'verified') {
            setCurrentStep('complete');
            queryClient_1.queryClient.invalidateQueries({ queryKey: ['/api/verification/status'] });
            setTimeout(() => {
                onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess();
                if (!mandatory)
                    onClose();
            }, 2000);
        }
        else if ((verificationResult === null || verificationResult === void 0 ? void 0 : verificationResult.status) === 'rejected') {
            setCurrentStep('failed');
        }
    }, [verificationResult]);
    // Skip if already verified
    (0, react_1.useEffect)(() => {
        if ((verificationStatus === null || verificationStatus === void 0 ? void 0 : verificationStatus.verified) && (verificationStatus === null || verificationStatus === void 0 ? void 0 : verificationStatus.validUntil)) {
            const validUntil = new Date(verificationStatus.validUntil);
            if (validUntil > new Date()) {
                setCurrentStep('complete');
            }
        }
    }, [verificationStatus]);
    const handleDocumentUpload = (data) => {
        setDocumentData(data);
        setCurrentStep('selfie');
    };
    const handleSelfieCapture = (selfie) => {
        setSelfieData(selfie);
        setCurrentStep('processing');
        submitVerificationMutation.mutate();
    };
    const getStepProgress = () => {
        const steps = {
            intro: 0,
            document: 33,
            selfie: 66,
            processing: 90,
            complete: 100,
            failed: 0,
        };
        return steps[currentStep];
    };
    const renderStepContent = () => {
        switch (currentStep) {
            case 'intro':
                return (React.createElement("div", { className: "space-y-6" },
                    React.createElement("div", { className: "text-center" },
                        React.createElement(lucide_react_1.Shield, { className: "h-16 w-16 mx-auto mb-4 text-primary" }),
                        React.createElement("h3", { className: "text-xl font-semibold mb-2", "data-testid": "text-verification-title" }, userType === 'creator' ? 'Creator Verification' : 'Co-Star Verification'),
                        React.createElement("p", { className: "text-muted-foreground" }, "Complete a quick identity verification to access all features")),
                    React.createElement("div", { className: "space-y-4" },
                        React.createElement(card_1.Card, null,
                            React.createElement(card_1.CardContent, { className: "flex items-start gap-3 pt-4" },
                                React.createElement(lucide_react_1.FileText, { className: "h-5 w-5 mt-0.5 text-muted-foreground" }),
                                React.createElement("div", null,
                                    React.createElement("h4", { className: "font-medium" }, "Step 1: Upload ID Document"),
                                    React.createElement("p", { className: "text-sm text-muted-foreground" }, "Take a photo of your passport, driver's license, or national ID")))),
                        React.createElement(card_1.Card, null,
                            React.createElement(card_1.CardContent, { className: "flex items-start gap-3 pt-4" },
                                React.createElement(lucide_react_1.Camera, { className: "h-5 w-5 mt-0.5 text-muted-foreground" }),
                                React.createElement("div", null,
                                    React.createElement("h4", { className: "font-medium" }, "Step 2: Take a Selfie"),
                                    React.createElement("p", { className: "text-sm text-muted-foreground" }, "We'll match your selfie with your ID photo")))),
                        React.createElement(card_1.Card, null,
                            React.createElement(card_1.CardContent, { className: "flex items-start gap-3 pt-4" },
                                React.createElement(lucide_react_1.CheckCircle, { className: "h-5 w-5 mt-0.5 text-muted-foreground" }),
                                React.createElement("div", null,
                                    React.createElement("h4", { className: "font-medium" }, "Step 3: Instant Verification"),
                                    React.createElement("p", { className: "text-sm text-muted-foreground" }, "Get verified in under 2 minutes with AI-powered approval"))))),
                    React.createElement(alert_1.Alert, null,
                        React.createElement(lucide_react_1.Shield, { className: "h-4 w-4" }),
                        React.createElement(alert_1.AlertDescription, null, "Your information is encrypted and securely stored in compliance with 18 U.S.C. \u00A72257")),
                    React.createElement("div", { className: "flex gap-3" },
                        !mandatory && (React.createElement(button_1.Button, { variant: "outline", onClick: onClose, className: "flex-1", "data-testid": "button-cancel" }, "Cancel")),
                        React.createElement(button_1.Button, { onClick: () => createSessionMutation.mutate(), disabled: createSessionMutation.isPending, className: "flex-1", "data-testid": "button-start-verification" },
                            "Start Verification",
                            React.createElement(lucide_react_1.ChevronRight, { className: "h-4 w-4 ml-2" })))));
            case 'document':
                return (React.createElement(IDUpload_1.default, { onUpload: handleDocumentUpload, onBack: () => setCurrentStep('intro') }));
            case 'selfie':
                return (React.createElement(SelfieCapture_1.default, { onCapture: handleSelfieCapture, onBack: () => setCurrentStep('document') }));
            case 'processing':
                return (React.createElement("div", { className: "space-y-6 text-center" },
                    React.createElement("div", { className: "flex justify-center" },
                        React.createElement("div", { className: "relative" },
                            React.createElement(lucide_react_1.Clock, { className: "h-16 w-16 text-primary animate-pulse" }),
                            React.createElement("div", { className: "absolute inset-0 animate-spin" },
                                React.createElement("div", { className: "h-full w-full rounded-full border-4 border-primary/20 border-t-primary" })))),
                    React.createElement("div", null,
                        React.createElement("h3", { className: "text-xl font-semibold mb-2", "data-testid": "text-processing" }, "Verifying Your Identity"),
                        React.createElement("p", { className: "text-muted-foreground" }, "This usually takes less than 30 seconds...")),
                    React.createElement(progress_1.Progress, { value: 90, className: "w-full" }),
                    React.createElement("p", { className: "text-sm text-muted-foreground" }, "Please don't close this window")));
            case 'complete':
                return (React.createElement("div", { className: "space-y-6 text-center" },
                    React.createElement(lucide_react_1.CheckCircle, { className: "h-16 w-16 mx-auto text-green-500" }),
                    React.createElement("div", null,
                        React.createElement("h3", { className: "text-xl font-semibold mb-2", "data-testid": "text-verification-complete" }, "Verification Complete!"),
                        React.createElement("p", { className: "text-muted-foreground" }, "Your identity has been verified successfully")),
                    (verificationStatus === null || verificationStatus === void 0 ? void 0 : verificationStatus.validUntil) && (React.createElement(alert_1.Alert, null,
                        React.createElement(alert_1.AlertDescription, null,
                            "Your verification is valid until ",
                            new Date(verificationStatus.validUntil).toLocaleDateString())))));
            case 'failed':
                return (React.createElement("div", { className: "space-y-6" },
                    React.createElement("div", { className: "text-center" },
                        React.createElement(lucide_react_1.AlertCircle, { className: "h-16 w-16 mx-auto text-red-500 mb-4" }),
                        React.createElement("h3", { className: "text-xl font-semibold mb-2", "data-testid": "text-verification-failed" }, "Verification Failed"),
                        React.createElement("p", { className: "text-muted-foreground" }, "We couldn't verify your identity. Please try again.")),
                    React.createElement(alert_1.Alert, { variant: "destructive" },
                        React.createElement(lucide_react_1.AlertCircle, { className: "h-4 w-4" }),
                        React.createElement(alert_1.AlertDescription, null, "Make sure your ID is clearly visible and your selfie matches the photo on your ID.")),
                    React.createElement("div", { className: "flex gap-3" },
                        React.createElement(button_1.Button, { variant: "outline", onClick: onClose, className: "flex-1", "data-testid": "button-close" }, "Close"),
                        React.createElement(button_1.Button, { onClick: () => {
                                setCurrentStep('intro');
                                setDocumentData(null);
                                setSelfieData(null);
                                setVerificationId(null);
                            }, className: "flex-1", "data-testid": "button-retry" }, "Try Again"))));
        }
    };
    return (React.createElement(dialog_1.Dialog, { open: open, onOpenChange: mandatory ? undefined : onClose },
        React.createElement(dialog_1.DialogContent, { className: "max-w-lg", "data-testid": "dialog-verification" },
            React.createElement(dialog_1.DialogHeader, null,
                React.createElement(dialog_1.DialogTitle, null, "Identity Verification"),
                React.createElement(dialog_1.DialogDescription, null, "Secure, fast verification powered by VerifyMy")),
            currentStep !== 'intro' && currentStep !== 'failed' && (React.createElement(progress_1.Progress, { value: getStepProgress(), className: "mb-4" })),
            renderStepContent())));
}
