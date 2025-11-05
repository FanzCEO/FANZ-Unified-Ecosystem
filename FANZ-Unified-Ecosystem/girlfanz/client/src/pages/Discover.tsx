import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  TrendingUp,
  Heart,
  Star,
  Zap,
  Filter,
} from "lucide-react";
import type { FeedPost } from "@shared/schema";

interface RecommendedContent {
  posts: FeedPost[];
  categories: string[];
  trendingCreators: any[];
  personalizedScore: number;
}

export default function Discover() {
  // Fetch AI-powered recommendations
  const { data: recommendations, isLoading } = useQuery<RecommendedContent>({
    queryKey: ['/api/discover'],
  });

  const categories = [
    { name: "For You", icon: Sparkles, color: "from-gf-cyber to-gf-pink" },
    { name: "Trending", icon: TrendingUp, color: "from-orange-500 to-red-500" },
    { name: "Favorites", icon: Heart, color: "from-pink-500 to-red-500" },
    { name: "Top Rated", icon: Star, color: "from-yellow-500 to-orange-500" },
    { name: "New Creators", icon: Zap, color: "from-green-500 to-blue-500" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gf-ink text-gf-snow p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gf-charcoal/50 rounded w-1/3"></div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 w-32 bg-gf-charcoal/50 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-gf-charcoal/50 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-3xl font-bold bg-gradient-to-r from-gf-cyber to-gf-pink bg-clip-text text-transparent flex items-center gap-2"
              data-testid="text-discover-title"
            >
              <Sparkles className="h-8 w-8 text-gf-cyber" />
              Discover
            </h1>
            <p className="text-gf-steel mt-1">
              AI-powered content recommendations just for you
            </p>
          </div>

          <Button
            variant="outline"
            className="border-gf-steel/20"
            data-testid="button-filter"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Personalization Score */}
        {recommendations?.personalizedScore && (
          <Card className="bg-gradient-to-r from-gf-cyber/10 to-gf-pink/10 border-gf-cyber/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gf-snow flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-gf-cyber" />
                    Personalization Score
                  </h3>
                  <p className="text-sm text-gf-steel mt-1">
                    Based on your viewing history and preferences
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold bg-gradient-to-r from-gf-cyber to-gf-pink bg-clip-text text-transparent">
                    {recommendations.personalizedScore}%
                  </div>
                  <p className="text-xs text-gf-steel mt-1">Accuracy</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category.name}
              className={`bg-gradient-to-r ${category.color} hover:opacity-90 whitespace-nowrap`}
              data-testid={`button-category-${category.name.toLowerCase().replace(' ', '-')}`}
            >
              <category.icon className="h-4 w-4 mr-2" />
              {category.name}
            </Button>
          ))}
        </div>

        {/* Trending Tags */}
        {recommendations?.categories && recommendations.categories.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gf-snow mb-3">
              Trending Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {recommendations.categories.map((category) => (
                <Badge
                  key={category}
                  className="bg-gf-charcoal/50 border-gf-cyber/30 text-gf-snow hover:bg-gf-cyber/20 cursor-pointer"
                  data-testid={`badge-category-${category}`}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Content Grid */}
        <div>
          <h3 className="text-lg font-semibold text-gf-snow mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gf-cyber" />
            Recommended For You
          </h3>

          {!recommendations || recommendations.posts.length === 0 ? (
            <Card className="bg-gf-charcoal/50 border-gf-steel/20">
              <CardContent className="p-12 text-center">
                <Sparkles className="h-12 w-12 text-gf-steel mx-auto mb-4" />
                <h3 className="text-gf-snow font-semibold mb-2">
                  Building your recommendations
                </h3>
                <p className="text-gf-steel">
                  Start exploring content to get personalized recommendations
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.posts.map((post) => (
                <Card
                  key={post.id}
                  className="bg-gf-charcoal/50 border-gf-steel/20 overflow-hidden hover:border-gf-cyber/50 transition-colors cursor-pointer"
                  data-testid={`card-recommended-post-${post.id}`}
                >
                  <div className="relative h-48 bg-gradient-to-br from-gf-cyber/20 to-gf-pink/20"></div>
                  <CardContent className="p-4">
                    <p className="text-gf-snow line-clamp-2 mb-2">
                      {post.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gf-steel">
                      <span>@creator</span>
                      <Badge className="bg-gf-cyber/20 text-gf-cyber">
                        98% match
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* AI Insights */}
        <Card className="bg-gf-charcoal/50 border-gf-cyber/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gf-snow mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-gf-cyber" />
              AI Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-gf-ink rounded-lg">
                <p className="text-gf-steel mb-1">Most viewed category</p>
                <p className="text-gf-snow font-semibold">Photography</p>
              </div>
              <div className="p-4 bg-gf-ink rounded-lg">
                <p className="text-gf-steel mb-1">Average watch time</p>
                <p className="text-gf-snow font-semibold">12 min</p>
              </div>
              <div className="p-4 bg-gf-ink rounded-lg">
                <p className="text-gf-steel mb-1">Engagement rate</p>
                <p className="text-gf-snow font-semibold">85%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
