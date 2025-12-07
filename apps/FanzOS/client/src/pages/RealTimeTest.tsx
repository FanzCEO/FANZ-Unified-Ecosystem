import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Activity, Send, Zap, MessageSquare, Heart, DollarSign, Users, Video, Bell, Server } from 'lucide-react';

interface EventMessage {
  id: string;
  event: string;
  data: any;
  timestamp: string;
}

interface ServerStatus {
  express: boolean;
  go: boolean;
  database: boolean;
  sse: boolean;
}

export default function RealTimeTest() {
  const [events, setEvents] = useState<EventMessage[]>([]);
  const [sseStatus, setSseStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    express: false,
    go: false,
    database: false,
    sse: false
  });
  const [testMessage, setTestMessage] = useState('');
  const [tipAmount, setTipAmount] = useState('10');
  const eventSourceRef = useRef<EventSource | null>(null);
  const { toast } = useToast();

  // Test server connections
  const testConnections = async () => {
    try {
      // Test Express server
      try {
        const expressResponse = await fetch('http://localhost:5000/api/auth/user', {
          credentials: 'include'
        });
        setServerStatus(prev => ({ ...prev, express: expressResponse.ok || expressResponse.status === 401 }));
      } catch {
        setServerStatus(prev => ({ ...prev, express: false }));
      }

      // Test Go server
      try {
        const goResponse = await fetch('http://localhost:8080/api/status');
        const goData = await goResponse.json();
        setServerStatus(prev => ({ ...prev, go: goResponse.ok, database: true }));
      } catch {
        setServerStatus(prev => ({ ...prev, go: false }));
      }
    } catch (error) {
      console.error('Connection test error:', error);
    }
  };

  // Connect to SSE
  const connectSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setSseStatus('connecting');
    const eventSource = new EventSource('http://localhost:8080/events');

    eventSource.onopen = () => {
      setSseStatus('connected');
      setServerStatus(prev => ({ ...prev, sse: true }));
      toast({
        title: "Connected",
        description: "Real-time event stream connected successfully",
      });
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const newEvent: EventMessage = {
          id: event.lastEventId || Date.now().toString(),
          event: event.type || 'message',
          data,
          timestamp: new Date().toISOString()
        };
        setEvents(prev => [newEvent, ...prev].slice(0, 100)); // Keep last 100 events
      } catch (error) {
        console.error('Error parsing event:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setSseStatus('disconnected');
      setServerStatus(prev => ({ ...prev, sse: false }));
      toast({
        title: "Disconnected",
        description: "Lost connection to event stream",
        variant: "destructive"
      });
    };

    eventSourceRef.current = eventSource;
  };

  // Disconnect SSE
  const disconnectSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setSseStatus('disconnected');
    setServerStatus(prev => ({ ...prev, sse: false }));
  };

  // Test mutations
  const testEventMutation = useMutation({
    mutationFn: async (eventType: string) => {
      return await apiRequest('/api/test/realtime', {
        method: 'POST',
        body: JSON.stringify({
          type: eventType,
          message: testMessage || `Test ${eventType} event`,
          amount: eventType === 'tip' ? parseFloat(tipAmount) : undefined
        })
      });
    },
    onSuccess: (data, eventType) => {
      toast({
        title: "Event Triggered",
        description: `${eventType} event sent successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to trigger event",
        variant: "destructive"
      });
    }
  });

  const triggerManualEvent = useMutation({
    mutationFn: async () => {
      const response = await fetch('http://localhost:8080/api/trigger-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testMessage || 'Manual test event',
          type: 'test',
          timestamp: new Date().toISOString()
        })
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Manual Event",
        description: "Manual event broadcasted via Go server",
      });
      setTestMessage('');
    }
  });

  useEffect(() => {
    testConnections();
    const interval = setInterval(testConnections, 5000);
    return () => {
      clearInterval(interval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'live_stream': return <Video className="h-4 w-4" />;
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'tip': return <DollarSign className="h-4 w-4" />;
      case 'subscription': return <Users className="h-4 w-4" />;
      case 'comment': return <MessageSquare className="h-4 w-4" />;
      case 'follow': return <Heart className="h-4 w-4" />;
      case 'system': return <Server className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'live_stream': return 'bg-red-500';
      case 'tip': return 'bg-green-500';
      case 'subscription': return 'bg-purple-500';
      case 'message': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="realtime-test-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-Time Features Test</h1>
          <p className="text-muted-foreground">Test and monitor the dual-server architecture</p>
        </div>
        <Badge variant={sseStatus === 'connected' ? 'default' : 'secondary'} className="text-lg px-4 py-2">
          <Activity className="mr-2 h-4 w-4" />
          {sseStatus.toUpperCase()}
        </Badge>
      </div>

      {/* Server Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Express Server</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${serverStatus.express ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-sm">{serverStatus.express ? 'Running' : 'Offline'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Port 5000</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Go Server</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${serverStatus.go ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-sm">{serverStatus.go ? 'Running' : 'Offline'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Port 8080</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${serverStatus.database ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-sm">{serverStatus.database ? 'Connected' : 'Disconnected'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">PostgreSQL</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">SSE Stream</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${serverStatus.sse ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-sm">{serverStatus.sse ? 'Active' : 'Inactive'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Real-time Events</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">Event Stream</TabsTrigger>
          <TabsTrigger value="trigger">Trigger Events</TabsTrigger>
          <TabsTrigger value="simulate">Simulate Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-Time Event Stream</CardTitle>
              <CardDescription>Monitor incoming SSE events from the Go server</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={connectSSE} 
                  disabled={sseStatus === 'connected'}
                  data-testid="button-connect-sse"
                >
                  Connect to SSE
                </Button>
                <Button 
                  onClick={disconnectSSE} 
                  variant="outline" 
                  disabled={sseStatus === 'disconnected'}
                  data-testid="button-disconnect-sse"
                >
                  Disconnect
                </Button>
                <Button 
                  onClick={() => setEvents([])} 
                  variant="outline"
                  data-testid="button-clear-events"
                >
                  Clear Events
                </Button>
              </div>

              <ScrollArea className="h-[400px] border rounded-lg p-4">
                {events.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No events received yet. Connect to SSE to start monitoring.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {events.map((event, index) => (
                      <div 
                        key={`${event.id}-${index}`} 
                        className="border rounded-lg p-3 space-y-2"
                        data-testid={`event-item-${index}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getEventIcon(event.data.event_type || event.event)}
                            <Badge className={getEventColor(event.data.event_type || event.event)}>
                              {event.data.event_type || event.event || 'unknown'}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trigger" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Event Trigger</CardTitle>
              <CardDescription>Send custom events through the Go server</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-message">Event Message</Label>
                <Textarea
                  id="test-message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Enter your test message..."
                  data-testid="input-test-message"
                />
              </div>
              <Button 
                onClick={() => triggerManualEvent.mutate()}
                disabled={triggerManualEvent.isPending}
                data-testid="button-trigger-manual"
              >
                <Send className="mr-2 h-4 w-4" />
                Send Manual Event
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Simulate Platform Actions</CardTitle>
              <CardDescription>Test real-time notifications for FansLab features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => testEventMutation.mutate('live_stream')}
                  disabled={testEventMutation.isPending}
                  variant="outline"
                  data-testid="button-test-livestream"
                >
                  <Video className="mr-2 h-4 w-4" />
                  Start Live Stream
                </Button>
                
                <Button 
                  onClick={() => testEventMutation.mutate('new_content')}
                  disabled={testEventMutation.isPending}
                  variant="outline"
                  data-testid="button-test-content"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  New Content
                </Button>
                
                <Button 
                  onClick={() => testEventMutation.mutate('message')}
                  disabled={testEventMutation.isPending}
                  variant="outline"
                  data-testid="button-test-message"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  New Message
                </Button>
                
                <Button 
                  onClick={() => testEventMutation.mutate('subscription')}
                  disabled={testEventMutation.isPending}
                  variant="outline"
                  data-testid="button-test-subscription"
                >
                  <Users className="mr-2 h-4 w-4" />
                  New Subscription
                </Button>
                
                <Button 
                  onClick={() => testEventMutation.mutate('follow')}
                  disabled={testEventMutation.isPending}
                  variant="outline"
                  data-testid="button-test-follow"
                >
                  <Heart className="mr-2 h-4 w-4" />
                  New Follower
                </Button>
                
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    placeholder="Amount"
                    className="w-24"
                    data-testid="input-tip-amount"
                  />
                  <Button 
                    onClick={() => testEventMutation.mutate('tip')}
                    disabled={testEventMutation.isPending}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-test-tip"
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Send Tip
                  </Button>
                </div>
              </div>

              {testEventMutation.isPending && (
                <Alert>
                  <AlertDescription>
                    Sending test event...
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}