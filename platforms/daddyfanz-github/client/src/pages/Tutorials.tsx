import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiRequest } from "@/lib/queryClient";
import { 
  GraduationCap,
  Search,
  Play,
  CheckCircle2,
  Clock,
  Star,
  Users,
  DollarSign,
  Camera,
  Shield,
  Lightbulb,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Video,
  FileText,
  Trophy,
  Target,
  TrendingUp
} from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  estimatedTime: number; // in minutes
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: number;
  completionRate: number;
  rating: number;
  enrolledUsers: number;
  steps: TutorialStep[];
  thumbnail?: string;
}

const tutorialCategories = [
  { id: "all", label: "All Tutorials", icon: GraduationCap },
  { id: "getting_started", label: "Getting Started", icon: BookOpen },
  { id: "content_creation", label: "Content Creation", icon: Camera },
  { id: "monetization", label: "Monetization", icon: DollarSign },
  { id: "marketing", label: "Marketing & Growth", icon: TrendingUp },
  { id: "security", label: "Security & Compliance", icon: Shield },
  { id: "advanced", label: "Advanced Features", icon: Lightbulb }
];

const difficultyColors = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

// Sample tutorial data - in real app this would come from API
const sampleTutorials: Tutorial[] = [
  {
    id: "1",
    title: "Getting Started as a Creator",
    description: "Complete guide to setting up your creator profile, verification, and first content upload.",
    category: "getting_started",
    difficulty: "beginner",
    estimatedTime: 30,
    completionRate: 85,
    rating: 4.8,
    enrolledUsers: 1250,
    steps: [
      { id: "1-1", title: "Create Your Profile", description: "Set up your creator profile with photos and bio", completed: false, estimatedTime: 10 },
      { id: "1-2", title: "Verify Your Identity", description: "Complete KYC verification process", completed: false, estimatedTime: 15 },
      { id: "1-3", title: "Upload Your First Content", description: "Learn how to upload and optimize content", completed: false, estimatedTime: 5 }
    ]
  },
  {
    id: "2",
    title: "Content Creation Best Practices",
    description: "Professional tips for creating engaging content that converts subscribers.",
    category: "content_creation",
    difficulty: "intermediate",
    estimatedTime: 45,
    completionRate: 78,
    rating: 4.6,
    enrolledUsers: 890,
    steps: [
      { id: "2-1", title: "Planning Your Content", description: "Develop a content strategy and calendar", completed: false, estimatedTime: 15 },
      { id: "2-2", title: "Photography & Video Tips", description: "Technical aspects of creating quality content", completed: false, estimatedTime: 20 },
      { id: "2-3", title: "Content Optimization", description: "SEO and engagement optimization techniques", completed: false, estimatedTime: 10 }
    ]
  },
  {
    id: "3",
    title: "Maximizing Your Earnings",
    description: "Advanced strategies for pricing, subscriptions, and revenue optimization.",
    category: "monetization",
    difficulty: "advanced",
    estimatedTime: 60,
    completionRate: 65,
    rating: 4.9,
    enrolledUsers: 560,
    steps: [
      { id: "3-1", title: "Subscription Pricing Strategy", description: "How to price your content for maximum revenue", completed: false, estimatedTime: 20 },
      { id: "3-2", title: "Pay-Per-View Content", description: "Creating and pricing premium content", completed: false, estimatedTime: 15 },
      { id: "3-3", title: "Fan Engagement & Retention", description: "Building loyal subscriber base", completed: false, estimatedTime: 25 }
    ]
  },
  {
    id: "4",
    title: "Marketing Your Profile",
    description: "Proven strategies to grow your audience and increase visibility.",
    category: "marketing",
    difficulty: "intermediate",
    estimatedTime: 40,
    completionRate: 72,
    rating: 4.5,
    enrolledUsers: 720,
    steps: [
      { id: "4-1", title: "Social Media Cross-Promotion", description: "Leverage other platforms to grow", completed: false, estimatedTime: 15 },
      { id: "4-2", title: "SEO for Adult Content", description: "Optimize your profile for discovery", completed: false, estimatedTime: 15 },
      { id: "4-3", title: "Collaboration Strategies", description: "Network with other creators", completed: false, estimatedTime: 10 }
    ]
  },
  {
    id: "5",
    title: "Security & Privacy Guide",
    description: "Essential security practices to protect yourself and your content.",
    category: "security",
    difficulty: "beginner",
    estimatedTime: 25,
    completionRate: 92,
    rating: 4.7,
    enrolledUsers: 1100,
    steps: [
      { id: "5-1", title: "Account Security Setup", description: "Two-factor authentication and strong passwords", completed: false, estimatedTime: 10 },
      { id: "5-2", title: "Content Protection", description: "Watermarking and content theft prevention", completed: false, estimatedTime: 10 },
      { id: "5-3", title: "Privacy Best Practices", description: "Protecting your personal information", completed: false, estimatedTime: 5 }
    ]
  }
];

export default function Tutorials() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [expandedTutorials, setExpandedTutorials] = useState<Set<string>>(new Set());

  const filteredTutorials = sampleTutorials.filter(tutorial => {
    const matchesCategory = selectedCategory === "all" || tutorial.category === selectedCategory;
    const matchesSearch = tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleTutorialExpansion = (tutorialId: string) => {
    const newExpanded = new Set(expandedTutorials);
    if (newExpanded.has(tutorialId)) {
      newExpanded.delete(tutorialId);
    } else {
      newExpanded.add(tutorialId);
    }
    setExpandedTutorials(newExpanded);
  };

  const calculateProgress = (tutorial: Tutorial) => {
    const completedSteps = tutorial.steps.filter(step => step.completed).length;
    return (completedSteps / tutorial.steps.length) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg backdrop-blur-sm">
              <GraduationCap className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Creator Tutorials</h1>
              <p className="text-slate-400">Master the platform with our comprehensive guides</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search tutorials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white pl-10"
                  data-testid="input-search-tutorials"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {tutorialCategories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`${
                      selectedCategory === category.id
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "border-slate-600 text-slate-300 hover:text-white hover:border-slate-500"
                    }`}
                    data-testid={`button-category-${category.id}`}
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {category.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-700">
            <TabsTrigger 
              value="browse" 
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
            >
              Browse Tutorials
            </TabsTrigger>
            <TabsTrigger 
              value="progress" 
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
            >
              My Progress
            </TabsTrigger>
            <TabsTrigger 
              value="achievements" 
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
            >
              Achievements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Featured Tutorial */}
            <Card className="border-slate-700/50 bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400/20">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                  <Badge className={difficultyColors.beginner}>
                    Beginner
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Getting Started as a Creator</h3>
                <p className="text-slate-300 mb-4">
                  Everything you need to know to launch your creator journey successfully. From profile setup to your first earnings.
                </p>
                <div className="flex items-center gap-6 text-sm text-slate-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    30 min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    1,250 enrolled
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    4.8 rating
                  </span>
                </div>
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  data-testid="button-start-featured"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Tutorial
                </Button>
              </CardContent>
            </Card>

            {/* Tutorials Grid */}
            <div className="space-y-4">
              {filteredTutorials.length === 0 ? (
                <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm text-center p-8">
                  <GraduationCap className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No tutorials found</h3>
                  <p className="text-slate-400">
                    Try adjusting your search or category filters.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredTutorials.map((tutorial) => {
                    const isExpanded = expandedTutorials.has(tutorial.id);
                    const progress = calculateProgress(tutorial);
                    
                    return (
                      <Card 
                        key={tutorial.id} 
                        className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-700/50 transition-colors"
                      >
                        <Collapsible
                          open={isExpanded}
                          onOpenChange={() => toggleTutorialExpansion(tutorial.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <CardHeader className="cursor-pointer hover:bg-slate-700/30 rounded-t-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <CardTitle className="text-lg text-white" data-testid={`text-tutorial-title-${tutorial.id}`}>
                                      {tutorial.title}
                                    </CardTitle>
                                    {isExpanded ? (
                                      <ChevronDown className="h-5 w-5 text-slate-400" />
                                    ) : (
                                      <ChevronRight className="h-5 w-5 text-slate-400" />
                                    )}
                                  </div>
                                  <p className="text-slate-400 mb-3" data-testid={`text-tutorial-description-${tutorial.id}`}>
                                    {tutorial.description}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3 text-sm">
                                    <Badge className={difficultyColors[tutorial.difficulty]} data-testid={`badge-difficulty-${tutorial.id}`}>
                                      {tutorial.difficulty}
                                    </Badge>
                                    <span className="text-slate-400 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {tutorial.estimatedTime} min
                                    </span>
                                    <span className="text-slate-400 flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {tutorial.enrolledUsers.toLocaleString()}
                                    </span>
                                    <span className="text-slate-400 flex items-center gap-1">
                                      <Star className="h-3 w-3" />
                                      {tutorial.rating}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {progress > 0 && (
                                <div className="mt-4">
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-slate-400">Progress</span>
                                    <span className="text-slate-400">{Math.round(progress)}%</span>
                                  </div>
                                  <Progress value={progress} className="h-2" data-testid={`progress-${tutorial.id}`} />
                                </div>
                              )}
                            </CardHeader>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <CardContent className="pt-0">
                              <div className="space-y-3">
                                {tutorial.steps.map((step, index) => (
                                  <div 
                                    key={step.id}
                                    className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg"
                                    data-testid={`step-${step.id}`}
                                  >
                                    <div className="flex-shrink-0 mt-1">
                                      {step.completed ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                                      ) : (
                                        <div className="h-5 w-5 rounded-full border-2 border-slate-500 flex items-center justify-center text-xs font-semibold text-slate-400">
                                          {index + 1}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className={`font-medium ${step.completed ? 'text-green-400' : 'text-white'}`}>
                                        {step.title}
                                      </h4>
                                      <p className="text-slate-400 text-sm mt-1">
                                        {step.description}
                                      </p>
                                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {step.estimatedTime} min
                                        </span>
                                        {step.completed && (
                                          <Badge variant="outline" className="text-green-400 border-green-400/50">
                                            Completed
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="flex gap-3 mt-6">
                                <Button 
                                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                  data-testid={`button-start-${tutorial.id}`}
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  {progress > 0 ? "Continue" : "Start Tutorial"}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  className="border-slate-600 text-slate-300 hover:text-white"
                                  data-testid={`button-bookmark-${tutorial.id}`}
                                >
                                  <BookOpen className="h-4 w-4 mr-2" />
                                  Bookmark
                                </Button>
                              </div>
                            </CardContent>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Overall Progress */}
              <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-400" />
                    Overall Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-400">Tutorials Completed</span>
                        <span className="text-white font-semibold">3 / 5</span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-purple-400">15h</div>
                        <div className="text-sm text-slate-400">Time Spent</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-pink-400">850</div>
                        <div className="text-sm text-slate-400">XP Earned</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-cyan-400" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <div className="flex-1">
                        <div className="text-sm text-white">Completed "Account Security"</div>
                        <div className="text-xs text-slate-400">2 hours ago</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Play className="h-4 w-4 text-purple-400" />
                      <div className="flex-1">
                        <div className="text-sm text-white">Started "Content Creation"</div>
                        <div className="text-xs text-slate-400">1 day ago</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Trophy className="h-4 w-4 text-yellow-400" />
                      <div className="flex-1">
                        <div className="text-sm text-white">Earned "First Steps" badge</div>
                        <div className="text-xs text-slate-400">3 days ago</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Streak */}
              <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    Learning Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400 mb-2">7</div>
                    <div className="text-sm text-slate-400 mb-4">Days in a row</div>
                    <div className="text-xs text-slate-500">
                      Keep it up! Study for 3 more days to earn the "Dedicated Learner" badge.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Sample achievements */}
              <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="h-16 w-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">First Steps</h3>
                  <p className="text-slate-400 text-sm mb-4">Complete your first tutorial</p>
                  <Badge className="bg-green-500/20 text-green-400 border-green-400/50">
                    Earned
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="h-16 w-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Quick Learner</h3>
                  <p className="text-slate-400 text-sm mb-4">Complete 5 tutorials in one week</p>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-400/50">
                    Earned
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm opacity-60">
                <CardContent className="p-6 text-center">
                  <div className="h-16 w-16 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-400 mb-2">Master Creator</h3>
                  <p className="text-slate-500 text-sm mb-4">Complete all tutorial categories</p>
                  <Badge variant="outline" className="border-slate-600 text-slate-500">
                    Locked
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}