import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon, Clock, Zap, Bot, TrendingUp, BarChart3,
  Target, Users, DollarSign, Heart, MessageSquare, Video, Image,
  Music, Mic, Share2, Bell, Settings, Filter, Search, Plus,
  Play, Pause, RefreshCw, Download, Upload, Save, Edit, Trash2,
  ChevronLeft, ChevronRight, Grid, List, Sparkles, Wand2,
  Lightbulb, Rocket, Trophy, Star, Gift, Crown, Diamond,
  Globe, Instagram, Twitter, Youtube, Facebook, Linkedin,
  CheckCircle, AlertCircle, XCircle, Info, ArrowUp, ArrowDown,
  Brain, Cpu, Database, Cloud, Shield, Lock, Unlock, Eye,
  TrendingDown, Activity, PieChart, LineChart, Package,
  Mail, Phone, MapPin, Link, Hash, Tag, Bookmark, Archive
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

export default function CreatorAutomation() {
  const { user } = useAuth() as { user: any };
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");

  // Automation settings
  const [automationSettings, setAutomationSettings] = useState({
    autoPost: true,
    autoReply: true,
    autoAnalyze: true,
    autoOptimize: true,
    autoSchedule: true,
    autoEngage: true,
    autoBackup: true,
    autoModerate: true
  });

  // Load scheduled content
  const { data: scheduledContent = [] } = useQuery({
    queryKey: ['/api/automation/scheduled'],
    queryFn: async () => {
      const response = await fetch('/api/automation/scheduled');
      return response.json();
    }
  });

  // Load automation workflows
  const { data: workflows = [] } = useQuery({
    queryKey: ['/api/automation/workflows'],
    queryFn: async () => {
      const response = await fetch('/api/automation/workflows');
      return response.json();
    }
  });

  // Load analytics
  const { data: analytics = {} } = useQuery({
    queryKey: ['/api/automation/analytics', selectedTimeRange],
    queryFn: async () => {
      const response = await fetch(`/api/automation/analytics?range=${selectedTimeRange}`);
      return response.json();
    }
  });

  // Schedule content mutation
  const scheduleContentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/automation/schedule", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/scheduled'] });
      toast({
        title: "Content Scheduled! 📅",
        description: "Your content has been scheduled successfully."
      });
      setShowScheduleModal(false);
    }
  });

  // AI content generation mutation
  const generateContentMutation = useMutation({
    mutationFn: async (params: any) => {
      return await apiRequest("POST", "/api/automation/generate", params);
    },
    onSuccess: (result) => {
      toast({
        title: "Content Generated! ✨",
        description: "AI has created new content for you."
      });
    }
  });

  // Automation workflow mutation
  const createWorkflowMutation = useMutation({
    mutationFn: async (workflow: any) => {
      return await apiRequest("POST", "/api/automation/workflow", workflow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/workflows'] });
      toast({
        title: "Workflow Created! 🤖",
        description: "Your automation workflow is now active."
      });
    }
  });

  // Predefined content templates
  const contentTemplates = [
    { id: "welcome", name: "Welcome Message", icon: Heart, type: "text" },
    { id: "promo", name: "Promotion", icon: Gift, type: "mixed" },
    { id: "teaser", name: "Teaser", icon: Eye, type: "video" },
    { id: "thankyou", name: "Thank You", icon: Trophy, type: "text" },
    { id: "announcement", name: "Announcement", icon: Bell, type: "text" },
    { id: "poll", name: "Poll/Question", icon: MessageSquare, type: "interactive" }
  ];

  // Automation workflows templates
  const workflowTemplates = [
    {
      name: "Welcome Series",
      description: "Automatically send welcome content to new subscribers",
      trigger: "new_subscriber",
      actions: ["send_message", "unlock_content", "schedule_followup"]
    },
    {
      name: "Re-engagement Campaign",
      description: "Win back inactive fans with special offers",
      trigger: "inactive_30_days",
      actions: ["send_discount", "highlight_content", "personal_message"]
    },
    {
      name: "Birthday Rewards",
      description: "Send special content on fan birthdays",
      trigger: "birthday",
      actions: ["send_gift", "exclusive_content", "discount_code"]
    },
    {
      name: "Tip Thank You",
      description: "Auto-reply to tips with personalized content",
      trigger: "tip_received",
      actions: ["thank_message", "bonus_content", "priority_reply"]
    },
    {
      name: "Content Drip",
      description: "Release content gradually to maintain engagement",
      trigger: "scheduled",
      actions: ["publish_content", "notify_fans", "track_engagement"]
    }
  ];

  // Best posting times analysis
  const bestPostingTimes = [
    { day: "Monday", times: ["9:00 AM", "12:00 PM", "7:00 PM"], engagement: 85 },
    { day: "Tuesday", times: ["10:00 AM", "2:00 PM", "8:00 PM"], engagement: 78 },
    { day: "Wednesday", times: ["11:00 AM", "3:00 PM", "9:00 PM"], engagement: 92 },
    { day: "Thursday", times: ["8:00 AM", "1:00 PM", "6:00 PM"], engagement: 88 },
    { day: "Friday", times: ["12:00 PM", "5:00 PM", "10:00 PM"], engagement: 95 },
    { day: "Saturday", times: ["10:00 AM", "4:00 PM", "11:00 PM"], engagement: 98 },
    { day: "Sunday", times: ["11:00 AM", "3:00 PM", "8:00 PM"], engagement: 90 }
  ];

  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  if (!user || user.role !== 'creator') {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Creator automation tools are only available for content creators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl" data-testid="creator-automation">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Creator Automation Hub
        </h1>
        <p className="text-muted-foreground mt-2">
          Automate your content, engage with fans, and grow your business on autopilot
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledContent.length}</div>
            <p className="text-xs text-muted-foreground">
              Next post in 2 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">All running</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42h</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation Score</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <Progress value={94} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">
            <Activity className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="schedule" data-testid="tab-schedule">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="workflows" data-testid="tab-workflows">
            <Bot className="h-4 w-4 mr-2" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="ai-tools" data-testid="tab-ai-tools">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Tools
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Automation Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Automation Controls</CardTitle>
                <CardDescription>Manage your automation settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(automationSettings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4 text-muted-foreground" />
                      <Label className="capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => 
                        setAutomationSettings(prev => ({ ...prev, [key]: checked }))
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common automation tasks</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center space-y-2"
                  onClick={() => setShowScheduleModal(true)}
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-xs">Schedule Post</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center space-y-2"
                  onClick={() => generateContentMutation.mutate({ type: 'post' })}
                >
                  <Wand2 className="h-5 w-5" />
                  <span className="text-xs">Generate Content</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center space-y-2"
                >
                  <Users className="h-5 w-5" />
                  <span className="text-xs">Bulk Message</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center space-y-2"
                >
                  <Gift className="h-5 w-5" />
                  <span className="text-xs">Send Rewards</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center space-y-2"
                >
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-xs">Boost Post</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center space-y-2"
                >
                  <Download className="h-5 w-5" />
                  <span className="text-xs">Export Data</span>
                </Button>
              </CardContent>
            </Card>

            {/* Best Posting Times */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Optimal Posting Schedule</CardTitle>
                <CardDescription>Best times to post for maximum engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bestPostingTimes.map((day) => (
                    <div key={day.day} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <span className="font-medium w-24">{day.day}</span>
                        <div className="flex space-x-2">
                          {day.times.map((time, i) => (
                            <Badge key={i} variant="secondary">
                              {time}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={day.engagement} className="w-20" />
                        <span className="text-sm font-medium">{day.engagement}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium">
                {format(selectedDate || new Date(), "MMMM yyyy")}
              </span>
              <Button variant="outline" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Grid className="h-4 w-4 mr-1" />
                Month
              </Button>
              <Button variant="outline" size="sm">
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
              <Button onClick={() => setShowScheduleModal(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Schedule Content
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border w-full"
                />
              </CardContent>
            </Card>

            {/* Scheduled Items */}
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Today</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {scheduledContent.map((item: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {item.time || "9:00 AM"}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {item.platform || "All"}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium">{item.title || `Post ${index + 1}`}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.description || "Scheduled content"}
                            </p>
                          </div>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Workflows */}
            <Card>
              <CardHeader>
                <CardTitle>Active Workflows</CardTitle>
                <CardDescription>Your automation workflows</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {workflows.map((workflow: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{workflow.name || `Workflow ${index + 1}`}</h4>
                            <p className="text-sm text-muted-foreground">
                              {workflow.description || "Automation workflow"}
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Triggered {workflow.triggerCount || 0} times
                          </span>
                          <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                            {workflow.status || 'Active'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Workflow Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Workflow Templates</CardTitle>
                <CardDescription>Pre-built automation workflows</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {workflowTemplates.map((template, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-1">{template.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {template.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {template.actions.slice(0, 2).map((action, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {action}
                              </Badge>
                            ))}
                            {template.actions.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.actions.length - 2}
                              </Badge>
                            )}
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => createWorkflowMutation.mutate(template)}
                          >
                            Use
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Workflow Builder */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Workflow Builder</CardTitle>
              <CardDescription>Create your own automation workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Workflow Name</Label>
                  <Input placeholder="Enter workflow name" className="mt-2" />
                </div>
                
                <div>
                  <Label>Trigger</Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new_subscriber">New Subscriber</SelectItem>
                      <SelectItem value="new_tip">New Tip</SelectItem>
                      <SelectItem value="new_message">New Message</SelectItem>
                      <SelectItem value="scheduled">Scheduled Time</SelectItem>
                      <SelectItem value="milestone">Milestone Reached</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Actions</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <Badge>1</Badge>
                      <Select className="flex-1">
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="send_message">Send Message</SelectItem>
                          <SelectItem value="unlock_content">Unlock Content</SelectItem>
                          <SelectItem value="send_discount">Send Discount</SelectItem>
                          <SelectItem value="add_tag">Add Tag</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Action
                    </Button>
                  </div>
                </div>

                <Button className="w-full">
                  Create Workflow
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Tools Tab */}
        <TabsContent value="ai-tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Content Generator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wand2 className="h-5 w-5 mr-2" />
                  Content Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="post">Social Post</SelectItem>
                    <SelectItem value="caption">Caption</SelectItem>
                    <SelectItem value="bio">Bio</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea placeholder="Describe what you want..." className="min-h-20" />
                <Button className="w-full" onClick={() => generateContentMutation.mutate({ type: 'post' })}>
                  Generate
                </Button>
              </CardContent>
            </Card>

            {/* Hashtag Optimizer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Hash className="h-5 w-5 mr-2" />
                  Hashtag Optimizer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea placeholder="Enter your content..." className="min-h-20" />
                <Button className="w-full">
                  Optimize Hashtags
                </Button>
                <div className="flex flex-wrap gap-1">
                  {['#trending', '#viral', '#fyp', '#creator'].map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Caption Writer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Type className="h-5 w-5 mr-2" />
                  Caption Writer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flirty">Flirty</SelectItem>
                    <SelectItem value="mysterious">Mysterious</SelectItem>
                    <SelectItem value="playful">Playful</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Main topic..." />
                <Button className="w-full">
                  Write Caption
                </Button>
              </CardContent>
            </Card>

            {/* Reply Assistant */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Reply Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-muted rounded text-sm">
                  "Hey beautiful, when will you post more?"
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">Flirty</Button>
                  <Button size="sm" variant="outline">Teasing</Button>
                  <Button size="sm" variant="outline">Thankful</Button>
                </div>
                <Textarea placeholder="Generated reply..." className="min-h-20" />
              </CardContent>
            </Card>

            {/* Trend Analyzer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Trend Analyzer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Cosplay content', 'ASMR videos', 'Workout streams'].map((trend, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{trend}</span>
                      <Badge variant="default">+{25 - i * 5}%</Badge>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-3">
                  View Full Report
                </Button>
              </CardContent>
            </Card>

            {/* Content Ideas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2" />
                  Content Ideas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {[
                      "Behind the scenes photoshoot",
                      "Q&A with fans",
                      "Outfit try-on haul",
                      "Morning routine video",
                      "Cooking in lingerie"
                    ].map((idea, i) => (
                      <div key={i} className="p-2 border rounded text-sm hover:bg-muted cursor-pointer">
                        {idea}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="flex justify-end mb-4">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Engagement Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={[
                    { time: "00:00", engagement: 20 },
                    { time: "04:00", engagement: 15 },
                    { time: "08:00", engagement: 45 },
                    { time: "12:00", engagement: 85 },
                    { time: "16:00", engagement: 65 },
                    { time: "20:00", engagement: 95 },
                    { time: "23:59", engagement: 70 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="engagement" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Platform Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Instagram', value: 35 },
                        { name: 'TikTok', value: 30 },
                        { name: 'Twitter', value: 20 },
                        { name: 'YouTube', value: 10 },
                        { name: 'Other', value: 5 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Automation Impact */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Automation Impact</CardTitle>
                <CardDescription>How automation is improving your metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500">+42%</div>
                    <p className="text-sm text-muted-foreground">Response Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-500">3.2x</div>
                    <p className="text-sm text-muted-foreground">Content Output</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-500">-65%</div>
                    <p className="text-sm text-muted-foreground">Time Spent</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-pink-500">+28%</div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Schedule Content Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Content Type</Label>
              <Select>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">Post</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="live">Live Stream</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Platforms</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Instagram', 'TikTok', 'Twitter', 'YouTube', 'Facebook'].map((platform) => (
                  <Badge key={platform} variant="outline" className="cursor-pointer">
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Content</Label>
              <Textarea placeholder="Enter your content..." className="mt-2 min-h-32" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start mt-2">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Time</Label>
                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={`${i}:00`}>
                        {i.toString().padStart(2, '0')}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => scheduleContentMutation.mutate({})}>
                Schedule
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}