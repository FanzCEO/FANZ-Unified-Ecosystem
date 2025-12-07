import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  HeadphonesIcon, 
  PlusIcon, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  MessageSquare,
  Bug,
  Lightbulb,
  User,
  Calendar,
  Filter
} from "lucide-react";
import type { Ticket } from "@shared/schema";

const ticketPriorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", 
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

const ticketStatusColors = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
};

const ticketTypeIcons = {
  bug: Bug,
  feature_request: Lightbulb,
  technical_support: HeadphonesIcon,
  billing: User
};

export default function HelpDesk() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    category: "technical_support" as const,
    priority: "medium" as const
  });

  // Fetch user's tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["/api/tickets"]
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: (ticketData: typeof newTicket) => 
      apiRequest("POST", "/api/tickets", ticketData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Support ticket created successfully!"
      });
      setNewTicket({
        title: "",
        description: "",
        category: "technical_support",
        priority: "medium"
      });
      setShowCreateForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create support ticket.",
        variant: "destructive"
      });
    }
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      toast({
        title: "Error", 
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    createTicketMutation.mutate(newTicket);
  };

  const filteredTickets = Array.isArray(tickets) 
    ? tickets.filter((ticket: Ticket) => {
        if (selectedCategory !== "all" && ticket.category !== selectedCategory) return false;
        if (selectedStatus !== "all" && ticket.status !== selectedStatus) return false;
        return true;
      })
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-cyan-500/20 rounded-lg backdrop-blur-sm">
              <HeadphonesIcon className="h-8 w-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Help Desk</h1>
              <p className="text-slate-400">Get technical support and submit feature requests</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                data-testid="button-create-ticket"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600 text-white" data-testid="select-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="technical_support">Technical Support</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600 text-white" data-testid="select-status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Tabs defaultValue="tickets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
            <TabsTrigger value="tickets" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              My Tickets
            </TabsTrigger>
            <TabsTrigger value="faq" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              FAQ & Guides
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-6">
            {/* Create Ticket Form */}
            {showCreateForm && (
              <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Create Support Ticket</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTicket} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="title" className="text-white">Title *</Label>
                        <Input
                          id="title"
                          value={newTicket.title}
                          onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                          placeholder="Brief description of your issue"
                          className="bg-slate-700 border-slate-600 text-white"
                          data-testid="input-ticket-title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="category" className="text-white">Category</Label>
                        <Select value={newTicket.category} onValueChange={(value: any) => setNewTicket({...newTicket, category: value})}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-ticket-category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bug">Bug Report</SelectItem>
                            <SelectItem value="feature_request">Feature Request</SelectItem>
                            <SelectItem value="technical_support">Technical Support</SelectItem>
                            <SelectItem value="billing">Billing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="priority" className="text-white">Priority</Label>
                      <Select value={newTicket.priority} onValueChange={(value: any) => setNewTicket({...newTicket, priority: value})}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-ticket-priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-white">Description *</Label>
                      <Textarea
                        id="description"
                        value={newTicket.description}
                        onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                        placeholder="Detailed description of your issue or request..."
                        className="bg-slate-700 border-slate-600 text-white min-h-[120px]"
                        data-testid="textarea-ticket-description"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        disabled={createTicketMutation.isPending}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                        data-testid="button-submit-ticket"
                      >
                        {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateForm(false)}
                        className="border-slate-600 text-slate-400 hover:text-white"
                        data-testid="button-cancel-ticket"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Tickets List */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="border-slate-700/30 bg-slate-700/30 animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-600 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredTickets.length === 0 ? (
                <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm text-center p-8">
                  <HeadphonesIcon className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No tickets found</h3>
                  <p className="text-slate-400 mb-4">
                    {selectedCategory !== "all" || selectedStatus !== "all" 
                      ? "No tickets match your current filters."
                      : "You haven't created any support tickets yet."}
                  </p>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                    data-testid="button-create-first-ticket"
                  >
                    Create Your First Ticket
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredTickets.map((ticket: Ticket) => {
                    const IconComponent = ticketTypeIcons[ticket.category as keyof typeof ticketTypeIcons] || HeadphonesIcon;
                    return (
                      <Card
                        key={ticket.id}
                        className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-700/50 transition-colors cursor-pointer"
                        data-testid={`card-ticket-${ticket.id}`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="p-2 bg-slate-700 rounded-lg">
                                <IconComponent className="h-5 w-5 text-cyan-400" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white mb-2" data-testid={`text-ticket-title-${ticket.id}`}>
                                  {ticket.title}
                                </h3>
                                <p className="text-slate-400 line-clamp-2" data-testid={`text-ticket-description-${ticket.id}`}>
                                  {ticket.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                              <Badge className={ticketStatusColors[ticket.status as keyof typeof ticketStatusColors]} data-testid={`badge-ticket-status-${ticket.id}`}>
                                {ticket.status?.replace('_', ' ')}
                              </Badge>
                              <Badge className={ticketPriorityColors[ticket.priority as keyof typeof ticketPriorityColors]} data-testid={`badge-ticket-priority-${ticket.id}`}>
                                {ticket.priority}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm text-slate-500">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "N/A"}
                              </span>
                              <span className="capitalize">
                                {ticket.category.replace('_', ' ')}
                              </span>
                            </div>
                            <span data-testid={`text-ticket-id-${ticket.id}`}>
                              #{ticket.id}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="faq" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Common Issues */}
              <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    Common Issues
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-700/50 rounded-lg">
                      <h4 className="font-semibold text-white mb-1">Payment Processing Issues</h4>
                      <p className="text-slate-400 text-sm">Having trouble with payments? Check our payment troubleshooting guide.</p>
                    </div>
                    <div className="p-3 bg-slate-700/50 rounded-lg">
                      <h4 className="font-semibold text-white mb-1">Content Upload Problems</h4>
                      <p className="text-slate-400 text-sm">Issues uploading photos or videos? Review our content guidelines.</p>
                    </div>
                    <div className="p-3 bg-slate-700/50 rounded-lg">
                      <h4 className="font-semibold text-white mb-1">Account Verification</h4>
                      <p className="text-slate-400 text-sm">Need help with identity verification? See our KYC process guide.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-cyan-400" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-slate-600 text-slate-300 hover:text-white"
                    data-testid="button-contact-support"
                  >
                    <HeadphonesIcon className="h-4 w-4 mr-2" />
                    Contact Live Support
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-slate-600 text-slate-300 hover:text-white"
                    data-testid="button-view-guides"
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    View Creator Guides
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-slate-600 text-slate-300 hover:text-white"
                    data-testid="button-report-bug"
                  >
                    <Bug className="h-4 w-4 mr-2" />
                    Report a Bug
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}