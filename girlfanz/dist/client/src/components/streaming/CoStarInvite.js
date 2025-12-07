"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CoStarInvite;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const queryClient_1 = require("@/lib/queryClient");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const badge_1 = require("@/components/ui/badge");
const use_toast_1 = require("@/hooks/use-toast");
const lucide_react_1 = require("lucide-react");
function CoStarInvite({ sessionId, streamId, coStars, onCoStarAdded }) {
    const { toast } = (0, use_toast_1.useToast)();
    const [inviteEmail, setInviteEmail] = (0, react_1.useState)('');
    const [pendingInvites, setPendingInvites] = (0, react_1.useState)([]);
    // Send invite mutation
    const sendInviteMutation = (0, react_query_1.useMutation)({
        mutationFn: async (email) => {
            // First check if user is verified
            const verificationResponse = await (0, queryClient_1.apiRequest)('/api/verification/check', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });
            if (!verificationResponse.isVerified) {
                throw new Error('User must be verified before joining a stream');
            }
            // Send the invite
            const response = await (0, queryClient_1.apiRequest)('/api/streams/invite-costar', {
                method: 'POST',
                body: JSON.stringify({
                    sessionId,
                    streamId,
                    email,
                }),
            });
            return response;
        },
        onSuccess: (data) => {
            const newInvite = {
                id: data.inviteId,
                userId: data.userId,
                name: data.name || inviteEmail,
                avatarUrl: data.avatarUrl,
                isVerified: true,
                status: 'pending',
            };
            setPendingInvites(prev => [...prev, newInvite]);
            setInviteEmail('');
            toast({
                title: "Invite sent",
                description: `Invitation sent to ${data.name || inviteEmail}`,
            });
        },
        onError: (error) => {
            toast({
                title: "Invite failed",
                description: error.message || "Failed to send invitation",
                variant: "destructive",
            });
        },
    });
    // Accept co-star mutation
    const acceptCoStarMutation = (0, react_query_1.useMutation)({
        mutationFn: async (coStarId) => {
            const response = await (0, queryClient_1.apiRequest)('/api/streams/accept-costar', {
                method: 'POST',
                body: JSON.stringify({
                    sessionId,
                    coStarId,
                }),
            });
            return response;
        },
        onSuccess: (data, coStarId) => {
            const coStar = pendingInvites.find(cs => cs.id === coStarId);
            if (coStar) {
                const acceptedCoStar = Object.assign(Object.assign({}, coStar), { status: 'accepted' });
                setPendingInvites(prev => prev.filter(cs => cs.id !== coStarId));
                onCoStarAdded(acceptedCoStar);
                toast({
                    title: "Co-star accepted",
                    description: `${coStar.name} can now join your stream`,
                });
            }
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to accept co-star",
                variant: "destructive",
            });
        },
    });
    // Reject co-star mutation
    const rejectCoStarMutation = (0, react_query_1.useMutation)({
        mutationFn: async (coStarId) => {
            const response = await (0, queryClient_1.apiRequest)('/api/streams/reject-costar', {
                method: 'POST',
                body: JSON.stringify({
                    sessionId,
                    coStarId,
                }),
            });
            return response;
        },
        onSuccess: (data, coStarId) => {
            setPendingInvites(prev => prev.filter(cs => cs.id !== coStarId));
            toast({
                title: "Co-star rejected",
                description: "The invitation has been declined",
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to reject co-star",
                variant: "destructive",
            });
        },
    });
    // Remove co-star mutation
    const removeCoStarMutation = (0, react_query_1.useMutation)({
        mutationFn: async (coStarId) => {
            const response = await (0, queryClient_1.apiRequest)('/api/streams/remove-costar', {
                method: 'POST',
                body: JSON.stringify({
                    sessionId,
                    coStarId,
                }),
            });
            return response;
        },
        onSuccess: (data, coStarId) => {
            toast({
                title: "Co-star removed",
                description: "The co-star has been removed from the stream",
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to remove co-star",
                variant: "destructive",
            });
        },
    });
    const handleSendInvite = () => {
        if (inviteEmail.trim()) {
            sendInviteMutation.mutate(inviteEmail.trim());
        }
    };
    return (React.createElement("div", { className: "space-y-4" },
        React.createElement(card_1.Card, null,
            React.createElement(card_1.CardHeader, null,
                React.createElement(card_1.CardTitle, { className: "flex items-center gap-2" },
                    React.createElement(lucide_react_1.UserPlus, { className: "h-5 w-5" }),
                    "Invite Co-Star")),
            React.createElement(card_1.CardContent, { className: "space-y-4" },
                React.createElement("div", { className: "flex gap-2" },
                    React.createElement(input_1.Input, { type: "email", placeholder: "Enter email address", value: inviteEmail, onChange: (e) => setInviteEmail(e.target.value), disabled: sendInviteMutation.isPending, "data-testid": "input-costar-email" }),
                    React.createElement(button_1.Button, { onClick: handleSendInvite, disabled: !inviteEmail || sendInviteMutation.isPending, "data-testid": "button-send-invite" },
                        React.createElement(lucide_react_1.Send, { className: "h-4 w-4 mr-2" }),
                        "Send")),
                React.createElement("div", { className: "flex items-center gap-2 text-sm text-muted-foreground" },
                    React.createElement(lucide_react_1.Shield, { className: "h-4 w-4" }),
                    React.createElement("span", null, "Only verified users can join as co-stars")))),
        pendingInvites.length > 0 && (React.createElement(card_1.Card, null,
            React.createElement(card_1.CardHeader, null,
                React.createElement(card_1.CardTitle, { className: "flex items-center gap-2" },
                    React.createElement(lucide_react_1.Clock, { className: "h-5 w-5" }),
                    "Pending Invites")),
            React.createElement(card_1.CardContent, { className: "space-y-2" }, pendingInvites.map((invite) => (React.createElement("div", { key: invite.id, className: "flex items-center justify-between p-3 border rounded-lg", "data-testid": `pending-invite-${invite.id}` },
                React.createElement("div", { className: "flex items-center gap-3" },
                    invite.avatarUrl ? (React.createElement("img", { src: invite.avatarUrl, alt: invite.name, className: "w-10 h-10 rounded-full" })) : (React.createElement("div", { className: "w-10 h-10 bg-secondary rounded-full flex items-center justify-center" }, invite.name.charAt(0).toUpperCase())),
                    React.createElement("div", null,
                        React.createElement("p", { className: "font-medium" }, invite.name),
                        React.createElement("div", { className: "flex items-center gap-2" }, invite.isVerified ? (React.createElement(badge_1.Badge, { variant: "default", className: "text-xs" },
                            React.createElement(lucide_react_1.CheckCircle, { className: "h-3 w-3 mr-1" }),
                            "Verified")) : (React.createElement(badge_1.Badge, { variant: "secondary", className: "text-xs" }, "Unverified"))))),
                React.createElement("div", { className: "flex gap-2" },
                    React.createElement(button_1.Button, { size: "sm", variant: "outline", onClick: () => acceptCoStarMutation.mutate(invite.id), disabled: acceptCoStarMutation.isPending, "data-testid": `button-accept-${invite.id}` },
                        React.createElement(lucide_react_1.CheckCircle, { className: "h-4 w-4" })),
                    React.createElement(button_1.Button, { size: "sm", variant: "outline", onClick: () => rejectCoStarMutation.mutate(invite.id), disabled: rejectCoStarMutation.isPending, "data-testid": `button-reject-${invite.id}` },
                        React.createElement(lucide_react_1.XCircle, { className: "h-4 w-4" }))))))))),
        coStars.length > 0 && (React.createElement(card_1.Card, null,
            React.createElement(card_1.CardHeader, null,
                React.createElement(card_1.CardTitle, null, "Active Co-Stars")),
            React.createElement(card_1.CardContent, { className: "space-y-2" }, coStars.map((coStar) => (React.createElement("div", { key: coStar.id, className: "flex items-center justify-between p-3 border rounded-lg", "data-testid": `active-costar-${coStar.id}` },
                React.createElement("div", { className: "flex items-center gap-3" },
                    coStar.avatarUrl ? (React.createElement("img", { src: coStar.avatarUrl, alt: coStar.name, className: "w-10 h-10 rounded-full" })) : (React.createElement("div", { className: "w-10 h-10 bg-secondary rounded-full flex items-center justify-center" }, coStar.name.charAt(0).toUpperCase())),
                    React.createElement("div", null,
                        React.createElement("p", { className: "font-medium" }, coStar.name),
                        React.createElement("div", { className: "flex items-center gap-2" },
                            coStar.status === 'joined' ? (React.createElement(badge_1.Badge, { className: "bg-green-600 text-xs" },
                                React.createElement("span", { className: "animate-pulse mr-1" }, "\u25CF"),
                                "Live")) : (React.createElement(badge_1.Badge, { variant: "secondary", className: "text-xs" }, "Accepted")),
                            coStar.isVerified && (React.createElement(badge_1.Badge, { variant: "default", className: "text-xs" },
                                React.createElement(lucide_react_1.CheckCircle, { className: "h-3 w-3 mr-1" }),
                                "Verified"))))),
                coStar.status === 'joined' && (React.createElement(button_1.Button, { size: "sm", variant: "destructive", onClick: () => removeCoStarMutation.mutate(coStar.id), disabled: removeCoStarMutation.isPending, "data-testid": `button-remove-${coStar.id}` },
                    React.createElement(lucide_react_1.XCircle, { className: "h-4 w-4 mr-2" }),
                    "Remove")))))))),
        coStars.some(cs => !cs.isVerified) && (React.createElement("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4" },
            React.createElement("div", { className: "flex items-start gap-3" },
                React.createElement(lucide_react_1.AlertTriangle, { className: "h-5 w-5 text-yellow-600 mt-0.5" }),
                React.createElement("div", { className: "space-y-1" },
                    React.createElement("p", { className: "text-sm font-medium text-yellow-900" }, "Verification Required"),
                    React.createElement("p", { className: "text-sm text-yellow-700" }, "Some co-stars are not verified. They will need to complete age verification before joining the stream.")))))));
}
