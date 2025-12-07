"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SupportTickets;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const input_1 = require("@/components/ui/input");
const textarea_1 = require("@/components/ui/textarea");
const select_1 = require("@/components/ui/select");
const tabs_1 = require("@/components/ui/tabs");
const dialog_1 = require("@/components/ui/dialog");
const lucide_react_1 = require("lucide-react");
const use_toast_1 = require("@/hooks/use-toast");
function SupportTickets() {
    const { toast } = (0, use_toast_1.useToast)();
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [isCreateTicketOpen, setIsCreateTicketOpen] = (0, react_1.useState)(false);
    const [newTicket, setNewTicket] = (0, react_1.useState)({
        subject: '',
        category: 'tech',
        priority: 'normal',
        description: ''
    });
    // Mock data for now - would be replaced with API call
    const mockTickets = [
        {
            id: 'ticket-1',
            subject: 'Unable to upload videos',
            category: 'tech',
            priority: 'high',
            status: 'open',
            createdAt: '2024-01-20T10:30:00Z',
            updatedAt: '2024-01-20T10:30:00Z',
            messageCount: 3
        },
        {
            id: 'ticket-2',
            subject: 'Payout not received',
            category: 'billing',
            priority: 'normal',
            status: 'in_progress',
            createdAt: '2024-01-19T14:20:00Z',
            updatedAt: '2024-01-20T09:15:00Z',
            messageCount: 5
        }
    ];
    const { data: tickets = mockTickets, isLoading } = (0, react_query_1.useQuery)({
        queryKey: ['/api/support/tickets'],
        initialData: mockTickets,
    });
    const filteredTickets = tickets.filter(ticket => ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const handleCreateTicket = async () => {
        try {
            // API call would go here
            toast({
                title: "Ticket Created",
                description: "Your support ticket has been created successfully.",
            });
            setIsCreateTicketOpen(false);
            setNewTicket({
                subject: '',
                category: 'tech',
                priority: 'normal',
                description: ''
            });
        }
        catch (error) {
            toast({
                title: "Error",
                description: "Failed to create ticket. Please try again.",
                variant: "destructive"
            });
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'open':
                return React.createElement(lucide_react_1.AlertCircle, { className: "h-4 w-4 text-yellow-500" });
            case 'in_progress':
                return React.createElement(lucide_react_1.Clock, { className: "h-4 w-4 text-blue-500" });
            case 'resolved':
                return React.createElement(lucide_react_1.CheckCircle, { className: "h-4 w-4 text-green-500" });
            case 'closed':
                return React.createElement(lucide_react_1.CheckCircle, { className: "h-4 w-4 text-gray-500" });
            default:
                return React.createElement(lucide_react_1.MessageCircle, { className: "h-4 w-4 text-gray-500" });
        }
    };
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'critical':
                return 'bg-red-600';
            case 'high':
                return 'bg-orange-600';
            case 'normal':
                return 'bg-blue-600';
            case 'low':
                return 'bg-green-600';
            default:
                return 'bg-gray-600';
        }
    };
    return (React.createElement("div", { className: "min-h-screen bg-black text-white" },
        React.createElement("div", { className: "fixed inset-0 opacity-20 bg-cover bg-center bg-no-repeat", style: {
                backgroundImage: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1000 1000\"><defs><radialGradient id=\"g\" cx=\"50%\" cy=\"50%\" r=\"50%\"><stop offset=\"0%\" stop-color=\"%23ff00ff\" stop-opacity=\"0.3\"/><stop offset=\"100%\" stop-color=\"%2300ffff\" stop-opacity=\"0.1\"/></radialGradient></defs><rect width=\"100%\" height=\"100%\" fill=\"url(%23g)\"/></svg>')"
            } }),
        React.createElement("div", { className: "relative container mx-auto px-4 py-8" },
            React.createElement("div", { className: "flex justify-between items-center mb-8" },
                React.createElement("div", null,
                    React.createElement("h1", { className: "text-4xl font-bold mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent" }, "Support Tickets"),
                    React.createElement("p", { className: "text-gray-400" }, "Manage your support requests and track their progress")),
                React.createElement(dialog_1.Dialog, { open: isCreateTicketOpen, onOpenChange: setIsCreateTicketOpen },
                    React.createElement(dialog_1.DialogTrigger, { asChild: true },
                        React.createElement(button_1.Button, { className: "bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700", "data-testid": "button-create-ticket" },
                            React.createElement(lucide_react_1.Plus, { className: "h-4 w-4 mr-2" }),
                            "Create Ticket")),
                    React.createElement(dialog_1.DialogContent, { className: "sm:max-w-md bg-gray-900 border-gray-800" },
                        React.createElement(dialog_1.DialogHeader, null,
                            React.createElement(dialog_1.DialogTitle, { className: "text-white" }, "Create Support Ticket")),
                        React.createElement("div", { className: "space-y-4" },
                            React.createElement("div", null,
                                React.createElement("label", { className: "text-sm font-medium text-gray-300 mb-2 block" }, "Subject"),
                                React.createElement(input_1.Input, { placeholder: "Brief description of your issue", value: newTicket.subject, onChange: (e) => setNewTicket(Object.assign(Object.assign({}, newTicket), { subject: e.target.value })), className: "bg-gray-800 border-gray-700 text-white", "data-testid": "input-ticket-subject" })),
                            React.createElement("div", { className: "grid grid-cols-2 gap-4" },
                                React.createElement("div", null,
                                    React.createElement("label", { className: "text-sm font-medium text-gray-300 mb-2 block" }, "Category"),
                                    React.createElement(select_1.Select, { value: newTicket.category, onValueChange: (value) => setNewTicket(Object.assign(Object.assign({}, newTicket), { category: value })) },
                                        React.createElement(select_1.SelectTrigger, { className: "bg-gray-800 border-gray-700 text-white" },
                                            React.createElement(select_1.SelectValue, null)),
                                        React.createElement(select_1.SelectContent, { className: "bg-gray-800 border-gray-700" },
                                            React.createElement(select_1.SelectItem, { value: "tech" }, "Technical Issue"),
                                            React.createElement(select_1.SelectItem, { value: "billing" }, "Billing & Payments"),
                                            React.createElement(select_1.SelectItem, { value: "moderation" }, "Content Moderation"),
                                            React.createElement(select_1.SelectItem, { value: "feature" }, "Feature Request"),
                                            React.createElement(select_1.SelectItem, { value: "other" }, "Other")))),
                                React.createElement("div", null,
                                    React.createElement("label", { className: "text-sm font-medium text-gray-300 mb-2 block" }, "Priority"),
                                    React.createElement(select_1.Select, { value: newTicket.priority, onValueChange: (value) => setNewTicket(Object.assign(Object.assign({}, newTicket), { priority: value })) },
                                        React.createElement(select_1.SelectTrigger, { className: "bg-gray-800 border-gray-700 text-white" },
                                            React.createElement(select_1.SelectValue, null)),
                                        React.createElement(select_1.SelectContent, { className: "bg-gray-800 border-gray-700" },
                                            React.createElement(select_1.SelectItem, { value: "low" }, "Low"),
                                            React.createElement(select_1.SelectItem, { value: "normal" }, "Normal"),
                                            React.createElement(select_1.SelectItem, { value: "high" }, "High"),
                                            React.createElement(select_1.SelectItem, { value: "critical" }, "Critical"))))),
                            React.createElement("div", null,
                                React.createElement("label", { className: "text-sm font-medium text-gray-300 mb-2 block" }, "Description"),
                                React.createElement(textarea_1.Textarea, { placeholder: "Please provide detailed information about your issue...", value: newTicket.description, onChange: (e) => setNewTicket(Object.assign(Object.assign({}, newTicket), { description: e.target.value })), className: "bg-gray-800 border-gray-700 text-white min-h-[120px]", "data-testid": "textarea-ticket-description" })),
                            React.createElement(button_1.Button, { onClick: handleCreateTicket, className: "w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700", "data-testid": "button-submit-ticket" }, "Create Ticket"))))),
            React.createElement("div", { className: "mb-6" },
                React.createElement("div", { className: "relative" },
                    React.createElement(lucide_react_1.Search, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }),
                    React.createElement(input_1.Input, { placeholder: "Search tickets...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-10 bg-gray-900/50 border-gray-800 text-white", "data-testid": "input-search-tickets" }))),
            React.createElement(tabs_1.Tabs, { defaultValue: "all", className: "space-y-6" },
                React.createElement(tabs_1.TabsList, { className: "bg-gray-900/50 border-gray-800" },
                    React.createElement(tabs_1.TabsTrigger, { value: "all", "data-testid": "tab-all-tickets" }, "All Tickets"),
                    React.createElement(tabs_1.TabsTrigger, { value: "open", "data-testid": "tab-open-tickets" }, "Open"),
                    React.createElement(tabs_1.TabsTrigger, { value: "in_progress", "data-testid": "tab-progress-tickets" }, "In Progress"),
                    React.createElement(tabs_1.TabsTrigger, { value: "resolved", "data-testid": "tab-resolved-tickets" }, "Resolved")),
                React.createElement(tabs_1.TabsContent, { value: "all" }, isLoading ? (React.createElement("div", { className: "space-y-4" }, [1, 2, 3].map((i) => (React.createElement(card_1.Card, { key: i, className: "bg-gray-900/50 border-gray-800" },
                    React.createElement(card_1.CardContent, { className: "p-6" },
                        React.createElement("div", { className: "animate-pulse space-y-3" },
                            React.createElement("div", { className: "h-4 bg-gray-700 rounded w-3/4" }),
                            React.createElement("div", { className: "h-3 bg-gray-700 rounded w-1/2" })))))))) : filteredTickets.length > 0 ? (React.createElement("div", { className: "space-y-4" }, filteredTickets.map((ticket) => (React.createElement(card_1.Card, { key: ticket.id, className: "bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer" },
                    React.createElement(card_1.CardContent, { className: "p-6" },
                        React.createElement("div", { className: "flex items-center justify-between mb-4" },
                            React.createElement("div", { className: "flex items-center space-x-3" },
                                getStatusIcon(ticket.status),
                                React.createElement("h3", { className: "font-semibold text-white" }, ticket.subject)),
                            React.createElement("div", { className: "flex items-center space-x-2" },
                                React.createElement(badge_1.Badge, { className: `${getPriorityColor(ticket.priority)} text-white` }, ticket.priority),
                                React.createElement(badge_1.Badge, { variant: "outline", className: "text-gray-300 border-gray-600" }, ticket.category))),
                        React.createElement("div", { className: "flex items-center justify-between text-sm text-gray-400" },
                            React.createElement("span", null,
                                "Created ",
                                new Date(ticket.createdAt).toLocaleDateString()),
                            React.createElement("div", { className: "flex items-center space-x-4" },
                                ticket.messageCount && (React.createElement("span", { className: "flex items-center" },
                                    React.createElement(lucide_react_1.MessageCircle, { className: "h-4 w-4 mr-1" }),
                                    ticket.messageCount,
                                    " messages")),
                                React.createElement(badge_1.Badge, { variant: "outline", className: `
                            ${ticket.status === 'open' ? 'border-yellow-600 text-yellow-400' : ''}
                            ${ticket.status === 'in_progress' ? 'border-blue-600 text-blue-400' : ''}
                            ${ticket.status === 'resolved' ? 'border-green-600 text-green-400' : ''}
                            ${ticket.status === 'closed' ? 'border-gray-600 text-gray-400' : ''}
                          ` }, ticket.status.replace('_', ' ')))))))))) : (React.createElement(card_1.Card, { className: "bg-gray-900/50 border-gray-800" },
                    React.createElement(card_1.CardContent, { className: "text-center py-12" },
                        React.createElement(lucide_react_1.MessageCircle, { className: "h-12 w-12 text-gray-500 mx-auto mb-4" }),
                        React.createElement("h3", { className: "text-lg font-semibold text-white mb-2" }, "No tickets found"),
                        React.createElement("p", { className: "text-gray-400 mb-4" }, searchQuery ? 'No tickets match your search criteria.' : 'You haven\'t created any support tickets yet.'),
                        React.createElement(button_1.Button, { onClick: () => setIsCreateTicketOpen(true), className: "bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700" },
                            React.createElement(lucide_react_1.Plus, { className: "h-4 w-4 mr-2" }),
                            "Create Your First Ticket"))))),
                React.createElement(tabs_1.TabsContent, { value: "open" },
                    React.createElement("div", { className: "space-y-4" }, filteredTickets.filter(t => t.status === 'open').map((ticket) => (React.createElement(card_1.Card, { key: ticket.id, className: "bg-gray-900/50 border-gray-800" }))))),
                React.createElement(tabs_1.TabsContent, { value: "in_progress" },
                    React.createElement("div", { className: "space-y-4" }, filteredTickets.filter(t => t.status === 'in_progress').map((ticket) => (React.createElement(card_1.Card, { key: ticket.id, className: "bg-gray-900/50 border-gray-800" }))))),
                React.createElement(tabs_1.TabsContent, { value: "resolved" },
                    React.createElement("div", { className: "space-y-4" }, filteredTickets.filter(t => t.status === 'resolved').map((ticket) => (React.createElement(card_1.Card, { key: ticket.id, className: "bg-gray-900/50 border-gray-800" })))))))));
}
