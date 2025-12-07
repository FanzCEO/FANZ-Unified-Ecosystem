import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, Star, Clock, Eye, ChevronRight, Brain, TrendingUp, Zap, Users, ArrowLeft } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useParams, Link } from 'wouter';

interface WikiArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content?: string;
  tags: string[];
  publishedAt: string;
  views?: number;
  rating?: number;
}

export default function WikiPage() {
  const { isAuthenticated } = useAuth();
  const params = useParams();
  const isDetailView = !!params.slug;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('browse');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch individual article for detail view
  const { data: articleDetail, isLoading: articleLoading } = useQuery<WikiArticle>({
    queryKey: ['/api/wiki/articles/by-slug', params.slug],
    queryFn: () => fetch(`/api/wiki/articles/by-slug/${params.slug}`).then(res => res.json()),
    enabled: isDetailView,
  });

  // Fetch regular articles
  const { data: articlesData, isLoading: articlesLoading } = useQuery<{ articles: WikiArticle[] }>({
    queryKey: ['/api/wiki/articles', searchQuery, selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('category', selectedCategory);
      if (searchQuery) params.set('search', searchQuery);
      const queryString = params.toString();
      const url = `/api/wiki/articles${queryString ? `?${queryString}` : ''}`;
      return fetch(url).then(res => res.json());
    },
    enabled: !isDetailView, // Only fetch when not in detail view
  });

  // Fetch semantic search results when search query is provided
  const { data: searchData, isLoading: searchLoading } = useQuery<{ articles: WikiArticle[] }>({
    queryKey: ['/api/wiki/search/semantic', searchQuery],
    queryFn: () => fetch(`/api/wiki/search/semantic?q=${encodeURIComponent(searchQuery)}`).then(res => res.json()),
    enabled: searchQuery.length >= 2,
  });

  // Fetch AI recommendations for authenticated users
  const { data: recommendationsData } = useQuery<{ articles: WikiArticle[] }>({
    queryKey: ['/api/wiki/recommendations'],
    enabled: isAuthenticated,
  });

  // Fetch popular articles
  const { data: popularData } = useQuery<{ articles: WikiArticle[] }>({
    queryKey: ['/api/wiki/popular'],
  });

  // Fetch trending articles
  const { data: trendingData } = useQuery<{ articles: WikiArticle[] }>({
    queryKey: ['/api/wiki/trending'],
  });

  // Record article view
  const recordViewMutation = useMutation({
    mutationFn: (articleId: string) => 
      apiRequest('POST', `/api/wiki/articles/${articleId}/view`, {}),
  });

  // Get search suggestions
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(async () => {
        try {
          const response = await fetch(`/api/wiki/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
          const data = await response.json();
          setSearchSuggestions(data.suggestions || []);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSearchSuggestions([]);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSearchSuggestions([]);
    }
  }, [searchQuery]);

  // Handle article click and view tracking
  const handleArticleClick = (article: WikiArticle) => {
    recordViewMutation.mutate(article.id);
    // For now, navigate to article detail at /wiki/article/slug
    window.location.href = `/wiki/article/${article.slug}`;
  };

  // Determine which articles to display
  const displayedArticles = searchQuery.length >= 2 
    ? searchData?.articles || []
    : articlesData?.articles || [];

  const isLoading = articlesLoading || searchLoading;

  const filteredArticles = displayedArticles.filter(article => {
    const matchesCategory = selectedCategory === null || 
      article.tags.includes(selectedCategory);
    return matchesCategory;
  });

  const allTags = Array.from(new Set(displayedArticles.flatMap(article => article.tags || [])));
  const popularTags = ['beginner', 'earnings', 'setup', 'guidelines', 'verification', 'moderation'];

  // Article Detail View
  if (isDetailView) {
    if (articleLoading) {
      return (
        <div className="min-h-screen bg-black text-white">
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-700 rounded w-1/3"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      );
    }

    if (!articleDetail) {
      return (
        <div className="min-h-screen bg-black text-white">
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Article not found</h3>
              <p className="text-gray-400 mb-4">The article you're looking for doesn't exist.</p>
              <Link href="/wiki">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Knowledge Base
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-black text-white">
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/wiki">
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Knowledge Base
              </Button>
            </Link>
          </div>

          {/* Article Content */}
          <article className="max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                {articleDetail.title}
              </h1>
              <p className="text-gray-400 text-base sm:text-lg mb-4">{articleDetail.summary}</p>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {new Date(articleDetail.publishedAt).toLocaleDateString()}
                </div>
                {articleDetail.views && (
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {articleDetail.views} views
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {articleDetail.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-blue-600 text-blue-400">
                    {tag}
                  </Badge>
                ))}
              </div>
            </header>

            <div className="prose prose-sm sm:prose prose-invert max-w-none">
              <div className="text-gray-300 text-base sm:text-lg leading-relaxed whitespace-pre-wrap break-words">
                {articleDetail.content}
              </div>
            </div>
          </article>
        </div>
      </div>
    );
  }

  // List View
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
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              AI Knowledge Base
            </h1>
          </div>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
            Intelligent search, personalized recommendations, and AI-powered insights to master the GirlFanz platform
          </p>
        </div>

        {/* Smart Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <div className="flex items-center gap-2 absolute left-3 top-3 z-10">
              {searchQuery.length >= 2 ? (
                <Brain className="h-5 w-5 text-cyan-400" />
              ) : (
                <Search className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <Input
              placeholder="Ask me anything... (AI-powered semantic search)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 sm:pl-12 h-11 sm:h-12 bg-gray-900/50 border-gray-800 text-white text-base sm:text-lg"
              data-testid="input-wiki-search"
            />
            
            {/* Search Suggestions */}
            {searchSuggestions.length > 0 && (
              <div className="absolute top-14 left-0 right-0 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-20">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchQuery(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 first:rounded-t-lg last:rounded-b-lg"
                    data-testid={`suggestion-${index}`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && (
              <div className="absolute top-14 left-0 text-xs text-cyan-400 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Semantic search active
              </div>
            )}
          </div>
        </div>

        {/* AI-Powered Content Tabs */}
        <div className="mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-900/50 border border-gray-800 mb-6">
              <TabsTrigger 
                value="browse" 
                className="flex items-center gap-2 data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
                data-testid="tab-browse"
              >
                <BookOpen className="h-4 w-4" />
                Browse
              </TabsTrigger>
              {isAuthenticated && (
                <TabsTrigger 
                  value="recommendations" 
                  className="flex items-center gap-2 data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
                  data-testid="tab-recommendations"
                >
                  <Brain className="h-4 w-4" />
                  For You
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="popular" 
                className="flex items-center gap-2 data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
                data-testid="tab-popular"
              >
                <Users className="h-4 w-4" />
                Popular
              </TabsTrigger>
              <TabsTrigger 
                value="trending" 
                className="flex items-center gap-2 data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
                data-testid="tab-trending"
              >
                <TrendingUp className="h-4 w-4" />
                Trending
              </TabsTrigger>
            </TabsList>

            {/* Browse Tab */}
            <TabsContent value="browse" className="space-y-6">
              {/* Popular Categories */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Filter by Topic</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    onClick={() => setSelectedCategory(null)}
                    className={selectedCategory === null ? 
                      "bg-blue-600 hover:bg-blue-700" : 
                      "border-gray-600 text-gray-300 hover:bg-gray-800"
                    }
                    data-testid="filter-all-topics"
                  >
                    All Topics
                  </Button>
                  {popularTags.map((tag) => (
                    <Button
                key={tag}
                variant={selectedCategory === tag ? "default" : "outline"}
                onClick={() => setSelectedCategory(selectedCategory === tag ? null : tag)}
                className={selectedCategory === tag ? 
                  "bg-blue-600 hover:bg-blue-700" : 
                  "border-gray-600 text-gray-300 hover:bg-gray-800"
                }
                data-testid={`filter-${tag}`}
              >
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </Button>
            ))}
          </div>
        </div>

              {/* Articles Grid */}
              {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="bg-gray-900/50 border-gray-800">
                      <CardHeader>
                        <div className="animate-pulse space-y-3">
                          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-700 rounded w-full"></div>
                          <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : filteredArticles.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <Card 
                key={article.id} 
                className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer group"
                onClick={() => handleArticleClick(article)}
                data-testid={`article-${article.slug}`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <BookOpen className="h-6 w-6 text-blue-400" />
                    <div className="flex items-center space-x-2">
                      {article.rating && (
                        <div className="flex items-center text-yellow-400">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-sm ml-1">{article.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-white group-hover:text-blue-400 transition-colors">
                    {article.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {article.summary}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {article.tags.slice(0, 3).map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="outline" 
                        className="text-xs border-blue-600 text-blue-400"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {article.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                        +{article.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </div>
                      {article.views && (
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {article.views}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No articles found</h3>
              <p className="text-gray-400 mb-4">
                {searchQuery ? 
                  `No articles match "${searchQuery}". Try different keywords or browse by category.` :
                  'No articles available at the moment.'
                }
              </p>
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
              )}
            </TabsContent>

            {/* Recommendations Tab */}
            {isAuthenticated && (
              <TabsContent value="recommendations" className="space-y-6">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Brain className="h-6 w-6 text-cyan-400" />
                    <h3 className="text-xl font-semibold text-white">Personalized for You</h3>
                  </div>
                  <p className="text-gray-400">AI-curated articles based on your interests and activity</p>
                </div>
                
                {recommendationsData?.articles && recommendationsData.articles.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendationsData.articles.map((article) => (
                      <Card 
                        key={article.id} 
                        className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-600/30 hover:bg-cyan-800/20 transition-colors cursor-pointer"
                        onClick={() => handleArticleClick(article)}
                        data-testid={`recommended-article-${article.id}`}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="h-5 w-5 text-cyan-400" />
                            <Badge variant="outline" className="text-xs border-cyan-600 text-cyan-400">
                              Recommended
                            </Badge>
                          </div>
                          <CardTitle className="text-white">{article.title}</CardTitle>
                          <CardDescription className="text-gray-400">{article.summary}</CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Brain className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Building Your Profile</h3>
                    <p className="text-gray-400">Read a few articles to get personalized recommendations!</p>
                  </div>
                )}
              </TabsContent>
            )}

            {/* Popular Tab */}
            <TabsContent value="popular" className="space-y-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-6 w-6 text-orange-400" />
                  <h3 className="text-xl font-semibold text-white">Most Popular</h3>
                </div>
                <p className="text-gray-400">Articles loved by the community</p>
              </div>
              
              {popularData?.articles && popularData.articles.length > 0 ? (
                <div className="space-y-4">
                  {popularData.articles.map((article, index) => (
                    <Card 
                      key={article.id} 
                      className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border-orange-600/30 hover:bg-orange-800/20 transition-colors cursor-pointer"
                      onClick={() => handleArticleClick(article)}
                      data-testid={`popular-article-${article.id}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="text-2xl font-bold text-orange-400 min-w-[3rem]">
                            #{index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-white mb-2">{article.title}</h4>
                            <p className="text-gray-400 mb-3">{article.summary}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No popular articles yet</h3>
                  <p className="text-gray-400">Check back later for community favorites!</p>
                </div>
              )}
            </TabsContent>

            {/* Trending Tab */}
            <TabsContent value="trending" className="space-y-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                  <h3 className="text-xl font-semibold text-white">Trending Now</h3>
                </div>
                <p className="text-gray-400">Hot topics and recent discussions</p>
              </div>
              
              {trendingData?.articles && trendingData.articles.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {trendingData.articles.map((article) => (
                    <Card 
                      key={article.id} 
                      className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-600/30 hover:bg-green-800/20 transition-colors cursor-pointer"
                      onClick={() => handleArticleClick(article)}
                      data-testid={`trending-article-${article.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-5 w-5 text-green-400" />
                          <Badge variant="outline" className="text-xs border-green-600 text-green-400">
                            Trending
                          </Badge>
                        </div>
                        <CardTitle className="text-white">{article.title}</CardTitle>
                        <CardDescription className="text-gray-400">{article.summary}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No trending articles</h3>
                  <p className="text-gray-400">Check back soon for hot topics!</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}