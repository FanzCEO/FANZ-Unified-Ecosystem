import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { 
  Search, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Eye, 
  ThumbsUp, 
  Bot, 
  Sparkles, 
  Filter,
  ArrowRight,
  MessageCircle,
  Star,
  Grid,
  List
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WikiEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  lastUpdated: Date;
  viewCount: number;
}

interface SearchResult {
  entry: WikiEntry;
  relevanceScore: number;
  snippet: string;
}

export default function AIWiki() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch popular articles
  const { data: popularArticles = [] } = useQuery({
    queryKey: ["/api/wiki/popular"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/wiki/popular");
      return response.json();
    }
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/wiki/categories"], 
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/wiki/categories");
      return response.json();
    }
  });

  // Search functionality
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/wiki/search", { query });
      return response.json();
    },
    onSuccess: (results) => {
      console.log("Search results:", results);
    }
  });

  // AI Assistant Query
  const aiQueryMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await apiRequest("POST", "/api/wiki/ask", { question });
      return response.json();
    },
    onSuccess: (response) => {
      setAiAnswer(response.answer);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    }
  });

  const [aiAnswer, setAiAnswer] = useState("");
  const [aiQuestion, setAiQuestion] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchMutation.mutate(searchQuery);
    }
  };

  const handleAiQuery = () => {
    if (aiQuestion.trim()) {
      aiQueryMutation.mutate(aiQuestion);
    }
  };

  const filteredArticles = Array.isArray(popularArticles) 
    ? (selectedCategory === "all" 
        ? popularArticles 
        : popularArticles.filter((article: WikiEntry) => article.category === selectedCategory))
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                <Bot className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  AI Knowledge Base
                  <Sparkles className="h-6 w-6 text-yellow-400" />
                </h1>
                <p className="text-slate-300">Intelligent help system powered by AI</p>
              </div>
            </div>
            <Link href="/" data-testid="link-back-home">
              <Button variant="outline" className="border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/10">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="search" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
            <TabsTrigger value="search" data-testid="tab-search">
              <Search className="h-4 w-4 mr-2" />
              Search
            </TabsTrigger>
            <TabsTrigger value="ai-assistant" data-testid="tab-ai-assistant">
              <Bot className="h-4 w-4 mr-2" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="browse" data-testid="tab-browse">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="popular" data-testid="tab-popular">
              <TrendingUp className="h-4 w-4 mr-2" />
              Popular
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Search className="h-5 w-5 text-cyan-400" />
                  Search Knowledge Base
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Find answers to your questions about DaddyFanz
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Search for help articles, guides, and FAQs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                    data-testid="input-search-query"
                  />
                  <Button 
                    onClick={handleSearch}
                    disabled={searchMutation.isPending}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                    data-testid="button-search"
                  >
                    {searchMutation.isPending ? "Searching..." : "Search"}
                  </Button>
                </div>

                {searchMutation.data && Array.isArray(searchMutation.data) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">
                      Search Results ({searchMutation.data.length})
                    </h3>
                    {searchMutation.data.map((result: SearchResult) => (
                      <Card key={result.entry.id} className="border-slate-700/30 bg-slate-700/30">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-white text-lg">{result.entry.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {result.entry.category}
                                </Badge>
                                <div className="flex items-center text-slate-400 text-xs">
                                  <Eye className="h-3 w-3 mr-1" />
                                  {result.entry.viewCount}
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-cyan-300 border-cyan-400/30">
                              {result.relevanceScore}% match
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-300 text-sm mb-3">{result.snippet}</p>
                          <div className="flex items-center gap-2">
                            {result.entry.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="ai-assistant" className="space-y-6">
            <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bot className="h-5 w-5 text-cyan-400" />
                  AI Assistant
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Ask questions in natural language and get intelligent answers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-3">
                  <Input
                    placeholder="Ask me anything about DaddyFanz... How do I set up payments? How does verification work?"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAiQuery()}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                    data-testid="input-ai-question"
                  />
                  <Button 
                    onClick={handleAiQuery}
                    disabled={aiQueryMutation.isPending}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    data-testid="button-ask-ai"
                  >
                    {aiQueryMutation.isPending ? (
                      <>
                        <Bot className="h-4 w-4 mr-2 animate-pulse" />
                        Thinking...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Ask AI
                      </>
                    )}
                  </Button>
                </div>

                {aiAnswer && (
                  <Card className="border-cyan-400/30 bg-gradient-to-r from-cyan-900/20 to-blue-900/20">
                    <CardHeader>
                      <CardTitle className="text-cyan-300 text-lg flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        AI Response
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-invert max-w-none text-slate-300">
                        {aiAnswer.split('\n').map((paragraph, index) => (
                          <p key={index} className="mb-3 last:mb-0">{paragraph}</p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Questions */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">Quick Questions</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      "How do I verify my age and identity?",
                      "What payment processors do you support?",
                      "How does content moderation work?",
                      "How do I set up subscriptions?",
                      "What are the revenue sharing terms?",
                      "How do I enable real-time messaging?"
                    ].map((question) => (
                      <Button
                        key={question}
                        variant="outline"
                        onClick={() => setAiQuestion(question)}
                        className="text-left justify-start text-slate-300 border-slate-600 hover:bg-slate-700/50"
                        data-testid={`button-quick-question-${question.split(' ').slice(0, 3).join('-').toLowerCase()}`}
                      >
                        <ArrowRight className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{question}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Browse Articles</h2>
              <div className="flex items-center gap-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white rounded-md px-3 py-2"
                  data-testid="select-category"
                >
                  <option value="all">All Categories</option>
                  {Array.isArray(categories) && categories.map((category: string) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <div className="flex border border-slate-600 rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none border-r-0"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredArticles.map((article: WikiEntry) => (
                <Card key={article.id} className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg leading-tight">{article.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {article.category}
                          </Badge>
                          <div className="flex items-center text-slate-400 text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            {article.viewCount}
                          </div>
                          <div className="flex items-center text-slate-400 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(article.lastUpdated).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 text-sm mb-4 line-clamp-3">
                      {article.content.substring(0, 150)}...
                    </p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {article.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {article.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{article.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                      data-testid={`button-read-article-${article.id}`}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Read Article
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Popular Tab */}
          <TabsContent value="popular" className="space-y-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Most Popular Articles</h2>
            </div>

            <div className="space-y-4">
              {Array.isArray(popularArticles) && popularArticles.map((article: WikiEntry, index: number) => (
                <Card key={article.id} className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center font-bold text-slate-900">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">{article.title}</h3>
                        <p className="text-slate-300 text-sm mb-3 line-clamp-2">
                          {article.content.substring(0, 200)}...
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {article.viewCount.toLocaleString()} views
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {article.category}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Updated {new Date(article.lastUpdated).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/10"
                        data-testid={`button-view-popular-${article.id}`}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Read
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}