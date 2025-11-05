import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MessageCircle, Clock, CheckCircle, AlertCircle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export default function SupportTickets() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'tech',
    priority: 'normal',
    description: ''
  });

  // Mock data for now - would be replaced with API call
  const mockTickets: SupportTicket[] = [
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

  const { data: tickets = mockTickets, isLoading } = useQuery<SupportTicket[]>({
    queryKey: ['/api/support/tickets'],
    initialData: mockTickets,
  });

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ghostly Background */}
      <div 
        className="fixed inset-0 opacity-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1000 1000\"><defs><radialGradient id=\"g\" cx=\"50%\" cy=\"50%\" r=\"50%\"><stop offset=\"0%\" stop-color=\"%23ff00ff\" stop-opacity=\"0.3\"/><stop offset=\"100%\" stop-color=\"%2300ffff\" stop-opacity=\"0.1\"/></radialGradient></defs><rect width=\"100%\" height=\"100%\" fill=\"url(%23g)\"/></svg>')"
        }}
      />
      
      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Support Tickets
            </h1>
            <p className="text-gray-400">Manage your support requests and track their progress</p>
          </div>
          
          <Dialog open={isCreateTicketOpen} onOpenChange={setIsCreateTicketOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                data-testid="button-create-ticket"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
              <DialogHeader>
                <DialogTitle className="text-white">Create Support Ticket</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Subject
                  </label>
                  <Input
                    placeholder="Brief description of your issue"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-white"
                    data-testid="input-ticket-subject"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Category
                    </label>
                    <Select 
                      value={newTicket.category} 
                      onValueChange={(value) => setNewTicket({...newTicket, category: value})}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="tech">Technical Issue</SelectItem>
                        <SelectItem value="billing">Billing & Payments</SelectItem>
                        <SelectItem value="moderation">Content Moderation</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Priority
                    </label>
                    <Select 
                      value={newTicket.priority} 
                      onValueChange={(value) => setNewTicket({...newTicket, priority: value})}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Description
                  </label>
                  <Textarea
                    placeholder="Please provide detailed information about your issue..."
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-white min-h-[120px]"
                    data-testid="textarea-ticket-description"
                  />
                </div>
                
                <Button 
                  onClick={handleCreateTicket}
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                  data-testid="button-submit-ticket"
                >
                  Create Ticket
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900/50 border-gray-800 text-white"
              data-testid="input-search-tickets"
            />
          </div>
        </div>

        {/* Tickets List */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-gray-900/50 border-gray-800">
            <TabsTrigger value="all" data-testid="tab-all-tickets">All Tickets</TabsTrigger>
            <TabsTrigger value="open" data-testid="tab-open-tickets">Open</TabsTrigger>
            <TabsTrigger value="in_progress" data-testid="tab-progress-tickets">In Progress</TabsTrigger>
            <TabsTrigger value="resolved" data-testid="tab-resolved-tickets">Resolved</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-gray-900/50 border-gray-800">
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredTickets.length > 0 ? (
              <div className="space-y-4">
                {filteredTickets.map((ticket) => (
                  <Card key={ticket.id} className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(ticket.status)}
                          <h3 className="font-semibold text-white">{ticket.subject}</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getPriorityColor(ticket.priority)} text-white`}>
                            {ticket.priority}
                          </Badge>
                          <Badge variant="outline" className="text-gray-300 border-gray-600">
                            {ticket.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                        <div className="flex items-center space-x-4">
                          {ticket.messageCount && (
                            <span className="flex items-center">
                              <MessageCircle className="h-4 w-4 mr-1" />
                              {ticket.messageCount} messages
                            </span>
                          )}
                          <Badge variant="outline" className={`
                            ${ticket.status === 'open' ? 'border-yellow-600 text-yellow-400' : ''}
                            ${ticket.status === 'in_progress' ? 'border-blue-600 text-blue-400' : ''}
                            ${ticket.status === 'resolved' ? 'border-green-600 text-green-400' : ''}
                            ${ticket.status === 'closed' ? 'border-gray-600 text-gray-400' : ''}
                          `}>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No tickets found</h3>
                  <p className="text-gray-400 mb-4">
                    {searchQuery ? 'No tickets match your search criteria.' : 'You haven\'t created any support tickets yet.'}
                  </p>
                  <Button 
                    onClick={() => setIsCreateTicketOpen(true)}
                    className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Ticket
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Other tab contents would filter by status */}
          <TabsContent value="open">
            <div className="space-y-4">
              {filteredTickets.filter(t => t.status === 'open').map((ticket) => (
                <Card key={ticket.id} className="bg-gray-900/50 border-gray-800">
                  {/* Same ticket card content */}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="in_progress">
            <div className="space-y-4">
              {filteredTickets.filter(t => t.status === 'in_progress').map((ticket) => (
                <Card key={ticket.id} className="bg-gray-900/50 border-gray-800">
                  {/* Same ticket card content */}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="resolved">
            <div className="space-y-4">
              {filteredTickets.filter(t => t.status === 'resolved').map((ticket) => (
                <Card key={ticket.id} className="bg-gray-900/50 border-gray-800">
                  {/* Same ticket card content */}
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}